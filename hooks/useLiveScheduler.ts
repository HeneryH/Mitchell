import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { base64ToUint8Array, decodeAudioData, createPcmBlob } from '../utils/audioUtils';
import { Appointment, LogEntry, ServiceType } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';
import { getServiceDuration, isSlotAvailable } from '../utils/dateUtils';

export const useLiveScheduler = () => {
  const [connected, setConnected] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const appointmentsRef = useRef<Appointment[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  
  useEffect(() => { appointmentsRef.current = appointments; }, [appointments]);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const addAppointment = useCallback((appt: Appointment) => {
    setAppointments(prev => [...prev, appt]);
    console.log(`[Mock Email] Confirmation to ${appt.customerName}`);
  }, []);

  const addLogEntry = useCallback((summary: string) => {
    setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), summary }, ...prev]);
  }, []);

  const checkAvailabilityFunc: FunctionDeclaration = {
    name: 'checkAvailability',
    description: 'Check availability for a service on a specific date and time',
    parameters: {
      type: Type.OBJECT,
      properties: {
        dateString: { type: Type.STRING, description: 'ISO 8601 Date String' },
        serviceType: { type: Type.STRING, description: 'Type of service' }
      },
      required: ['dateString', 'serviceType']
    }
  };

  const bookAppointmentFunc: FunctionDeclaration = {
    name: 'bookAppointment',
    description: 'Book an appointment',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bayId: { type: Type.STRING, description: 'Bay ID' },
        dateString: { type: Type.STRING, description: 'ISO 8601 Start date' },
        serviceType: { type: Type.STRING, description: 'Service type' },
        customerName: { type: Type.STRING, description: 'Customer name' },
        customerContact: { type: Type.STRING, description: 'Contact info' },
        vehicleMake: { type: Type.STRING, description: 'Vehicle Make' },
        vehicleModel: { type: Type.STRING, description: 'Vehicle Model' },
        vehicleYear: { type: Type.STRING, description: 'Vehicle Year' }
      },
      required: ['bayId', 'dateString', 'serviceType', 'customerName', 'customerContact']
    }
  };

  const logCallFunc: FunctionDeclaration = {
    name: 'logCall',
    description: 'Log the call summary',
    parameters: {
      type: Type.OBJECT,
      properties: { summary: { type: Type.STRING } },
      required: ['summary']
    }
  };

  const handleToolCall = useCallback(async (functionCalls: any[]) => {
    const responses = [];
    const currentAppointments = appointmentsRef.current;

    for (const fc of functionCalls) {
      let result: any = { error: 'Unknown function' };
      try {
        if (fc.name === 'checkAvailability') {
            const { dateString, serviceType } = fc.args;
            const start = new Date(dateString);
            if (isNaN(start.getTime())) throw new Error(`Invalid date: ${dateString}`);
            const duration = getServiceDuration(serviceType);
            const bay1Free = isSlotAvailable(start, duration, 'bay1', currentAppointments);
            const bay2Free = isSlotAvailable(start, duration, 'bay2', currentAppointments);
            
            if (bay1Free) result = { available: true, bayId: 'bay1', message: 'Bay 1 is available.' };
            else if (bay2Free) result = { available: true, bayId: 'bay2', message: 'Bay 2 is available.' };
            else result = { available: false, message: 'No availability.' };
        }
        else if (fc.name === 'bookAppointment') {
            const { bayId, dateString, serviceType, customerName, customerContact, vehicleMake, vehicleModel, vehicleYear } = fc.args;
            const start = new Date(dateString);
            const duration = getServiceDuration(serviceType);
            const end = new Date(start.getTime() + duration * 3600000);

            if (!isSlotAvailable(start, duration, bayId, currentAppointments)) {
                 result = { status: 'failed', message: 'Slot taken.' };
            } else {
                const newAppt: Appointment = {
                    id: Math.random().toString(36).substring(7),
                    bayId, start, end, serviceType: serviceType as ServiceType,
                    customerName, customerContact, vehicleMake, vehicleModel, vehicleYear
                };
                addAppointment(newAppt);
                result = { status: 'confirmed', appointmentId: newAppt.id };
            }
        }
        else if (fc.name === 'logCall') {
            addLogEntry(fc.args.summary);
            result = { status: 'logged' };
        }
      } catch (error: any) {
          console.error(error);
          result = { error: error.message };
      }
      responses.push({ id: fc.id, name: fc.name, response: { result } });
    }
    return responses;
  }, [addAppointment, addLogEntry]);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    await inputAudioContextRef.current.resume();
    await outputAudioContextRef.current.resume();

    analyserRef.current = inputAudioContextRef.current.createAnalyser();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = inputAudioContextRef.current.createMediaStreamSource(stream);
    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
    
    source.connect(analyserRef.current);

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [checkAvailabilityFunc, bookAppointmentFunc, logCallFunc] }]
      },
      callbacks: {
        onopen: () => {
          setConnected(true);
          if (inputAudioContextRef.current) {
             source.connect(scriptProcessor);
             scriptProcessor.connect(inputAudioContextRef.current.destination);
          }
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
            sourcesRef.current.clear();
            if (outputAudioContextRef.current) nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
            return; 
          }
          if (msg.toolCall) {
             try {
                // Safely handle possible undefined functionCalls
                const calls = msg.toolCall.functionCalls || [];
                const responses = await handleToolCall(calls);
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: responses }));
             } catch {}
          }
          // Safely access deep properties
          const audioStr = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioStr && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(base64ToUint8Array(audioStr), ctx);
            const s = ctx.createBufferSource();
            s.buffer = audioBuffer;
            s.connect(ctx.destination);
            s.addEventListener('ended', () => sourcesRef.current.delete(s));
            s.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(s);
          }
        },
        onclose: () => setConnected(false),
        onerror: () => setConnected(false)
      }
    });
    sessionPromiseRef.current = sessionPromise;

    scriptProcessor.onaudioprocess = (e) => {
        const blob = createPcmBlob(e.inputBuffer.getChannelData(0));
        sessionPromise.then(s => s.sendRealtimeInput({ media: blob }));
    };
  }, [handleToolCall]);

  const disconnect = useCallback(() => {
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setConnected(false);
    window.location.reload(); 
  }, []);

  return { connected, connect, disconnect, analyserNode: analyserRef.current, appointments, addAppointment, logs, addLogEntry, currentDate, setCurrentDate };
};