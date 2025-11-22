
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { base64ToUint8Array, decodeAudioData, createPcmBlob } from '../utils/audioUtils';
import { Appointment, LogEntry, ServiceType } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION, SERVICES, BAYS } from '../constants';
import { getServiceDuration, isSlotAvailable } from '../utils/dateUtils';

export const useLiveScheduler = () => {
  const [connected, setConnected] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Refs for state access inside callbacks to prevent stale closures
  const appointmentsRef = useRef<Appointment[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  
  useEffect(() => {
    appointmentsRef.current = appointments;
  }, [appointments]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Gemini Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Helper to add appointment (acting as DB write)
  const addAppointment = useCallback((appt: Appointment) => {
    setAppointments(prev => [...prev, appt]);
    // Logic to simulate email sending
    console.log(`[Mock Email Service] Sending Confirmation to ${appt.customerName} at ${appt.customerContact}`);
    if (appt.vehicleMake) {
        console.log(`[Mock Email Service] Vehicle: ${appt.vehicleYear || ''} ${appt.vehicleMake} ${appt.vehicleModel || ''}`);
    }
    console.log(`[Mock Email Service] Scheduled Reminder for ${new Date(appt.start.getTime() - 24*60*60*1000).toISOString()}`);
  }, []);

  const addLogEntry = useCallback((summary: string) => {
    setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date(), summary }, ...prev]);
  }, []);

  // --- Tool Definitions ---

  const checkAvailabilityFunc: FunctionDeclaration = {
    name: 'checkAvailability',
    description: 'Check availability for a service on a specific date and time',
    parameters: {
      type: Type.OBJECT,
      properties: {
        dateString: { type: Type.STRING, description: 'ISO 8601 Date String (e.g., "2023-10-27T14:00:00")' },
        serviceType: { type: Type.STRING, description: 'Type of service needed' }
      },
      required: ['dateString', 'serviceType']
    }
  };

  const bookAppointmentFunc: FunctionDeclaration = {
    name: 'bookAppointment',
    description: 'Book an appointment in a specific bay',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bayId: { type: Type.STRING, description: 'ID of the bay (bay1 or bay2)' },
        dateString: { type: Type.STRING, description: 'ISO 8601 Start date string' },
        serviceType: { type: Type.STRING, description: 'Service type' },
        customerName: { type: Type.STRING, description: 'Customer name' },
        customerContact: { type: Type.STRING, description: 'Customer contact info' },
        vehicleMake: { type: Type.STRING, description: 'Vehicle Make' },
        vehicleModel: { type: Type.STRING, description: 'Vehicle Model' },
        vehicleYear: { type: Type.STRING, description: 'Vehicle Year' }
      },
      required: ['bayId', 'dateString', 'serviceType', 'customerName', 'customerContact']
    }
  };

  const logCallFunc: FunctionDeclaration = {
    name: 'logCall',
    description: 'Log the call summary to the records',
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: 'Summary of the call' }
      },
      required: ['summary']
    }
  };

  // --- Tool Implementations ---

  const handleToolCall = useCallback(async (functionCalls: any[]) => {
    const responses = [];
    
    // Access state via Ref to ensure we have latest data inside the callback
    const currentAppointments = appointmentsRef.current;

    for (const fc of functionCalls) {
      let result: any = { error: 'Unknown function' };
      
      try {
        if (fc.name === 'checkAvailability') {
            const { dateString, serviceType } = fc.args;
            const start = new Date(dateString);
            
            if (isNaN(start.getTime())) {
                throw new Error(`Invalid date format provided: ${dateString}. Please provide ISO 8601 format.`);
            }

            const duration = getServiceDuration(serviceType);
            
            // Simple check for both bays
            const bay1Free = isSlotAvailable(start, duration, 'bay1', currentAppointments);
            const bay2Free = isSlotAvailable(start, duration, 'bay2', currentAppointments);

            if (bay1Free) result = { available: true, bayId: 'bay1', message: 'Bay 1 is available.' };
            else if (bay2Free) result = { available: true, bayId: 'bay2', message: 'Bay 2 is available.' };
            else result = { available: false, message: 'No bays available at this time. Please suggest another time.' };
        }

        else if (fc.name === 'bookAppointment') {
            const { 
                bayId, 
                dateString, 
                serviceType, 
                customerName, 
                customerContact, 
                vehicleMake, 
                vehicleModel, 
                vehicleYear 
            } = fc.args;
            
            const start = new Date(dateString);
            if (isNaN(start.getTime())) {
                throw new Error("Invalid date format for booking.");
            }

            const duration = getServiceDuration(serviceType);
            const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

            // Double check availability to prevent race condition in conversation
            if (!isSlotAvailable(start, duration, bayId, currentAppointments)) {
                 result = { status: 'failed', message: 'Slot is no longer available.' };
            } else {
                const newAppt: Appointment = {
                    id: Math.random().toString(36).substring(7),
                    bayId,
                    start,
                    end,
                    serviceType: serviceType as ServiceType,
                    customerName,
                    customerContact,
                    vehicleMake,
                    vehicleModel,
                    vehicleYear
                };
                
                addAppointment(newAppt);
                result = { status: 'confirmed', appointmentId: newAppt.id };
            }
        }

        else if (fc.name === 'logCall') {
            const { summary } = fc.args;
            addLogEntry(summary);
            result = { status: 'logged' };
        }

      } catch (error: any) {
          console.error(`Error executing tool ${fc.name}:`, error);
          result = { error: `Tool execution failed: ${error.message}` };
      }

      responses.push({
        id: fc.id,
        name: fc.name,
        response: { result }
      });
    }
    return responses;
  }, [addAppointment, addLogEntry]); // Refs are stable, no need to add them


  // --- Connection Logic ---

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      alert('API_KEY not found in environment variables.');
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Setup Audio Contexts
    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure contexts are running (browsers sometimes suspend them)
    await inputAudioContextRef.current.resume();
    await outputAudioContextRef.current.resume();

    // Analyser for Visualizer
    analyserRef.current = inputAudioContextRef.current.createAnalyser();

    // Get Microphone Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = inputAudioContextRef.current.createMediaStreamSource(stream);
    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

    // Always connect analyser for visuals immediately (local feedback)
    source.connect(analyserRef.current);

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [checkAvailabilityFunc, bookAppointmentFunc, logCallFunc] }]
      },
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Connected');
          setConnected(true);
          
          // Connect microphone stream to script processor to begin streaming to model
          if (inputAudioContextRef.current) {
             source.connect(scriptProcessor);
             scriptProcessor.connect(inputAudioContextRef.current.destination);
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Server Interruption (User spoke over model)
          if (message.serverContent?.interrupted) {
            console.log('Interrupted by user');
            // Stop all currently playing audio
            sourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) { /* ignore already stopped */ }
            });
            sourcesRef.current.clear();
            // Reset playback cursor to now
            if (outputAudioContextRef.current) {
                nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
            }
            return; 
          }

          // Handle Tools
          if (message.toolCall) {
             console.log('Tool Call:', message.toolCall);
             try {
                const responses = await handleToolCall(message.toolCall.functionCalls);
                sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
             } catch (e) {
                console.error("Failed to process tool call", e);
             }
          }

          // Handle Audio
          const audioStr = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioStr && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            
            // Ensure we schedule after current time
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            
            const audioBuffer = await decodeAudioData(
              base64ToUint8Array(audioStr),
              ctx
            );
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
               sourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }
        },
        onclose: () => {
          console.log('Gemini Live Closed');
          setConnected(false);
        },
        onerror: (err) => {
          console.error('Gemini Live Error', err);
          setConnected(false);
        }
      }
    });

    sessionPromiseRef.current = sessionPromise;

    // Input streaming logic (only effective once connected in onopen)
    scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const blob = createPcmBlob(inputData);
        sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
    };

  }, [handleToolCall]);

  const disconnect = useCallback(() => {
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setConnected(false);
    // Hard reload to clear all audio states and listeners efficiently for this demo
    window.location.reload(); 
  }, []);

  return {
    connected,
    connect,
    disconnect,
    analyserNode: analyserRef.current,
    appointments,
    addAppointment,
    logs,
    addLogEntry,
    currentDate,
    setCurrentDate
  };
};
