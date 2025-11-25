import React, { useState } from 'react';
import { SERVICES, OPERATING_HOURS } from '../constants';
import { ServiceType, Appointment } from '../types';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getServiceDuration } from '../utils/dateUtils';

interface ServiceRequestFormProps {
  onLogRequest: (summary: string) => void;
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ onLogRequest, addAppointment }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', serviceType: SERVICES[0].name, date: '', time: '', vehicleMake: '', vehicleModel: '', vehicleYear: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');

  // Generate 30-minute slots based on operating hours
  const timeSlots = [];
  for (let h = OPERATING_HOURS.start; h < OPERATING_HOURS.end; h++) {
    const hour = h.toString().padStart(2, '0');
    timeSlots.push(`${hour}:00`);
    timeSlots.push(`${hour}:30`);
  }

  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Construct Wall Clock Time string (YYYY-MM-DDTHH:MM:SS) strictly from inputs
    // We do NOT use new Date() conversion here to avoid browser timezone shifting
    const dateTimeString = `${formData.date}T${formData.time}:00`;
    const duration = getServiceDuration(formData.serviceType);

    try {
        // 1. Check Availability
        // The backend expects the literal string and will assume it is America/New_York time
        const checkBay1 = await fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: dateTimeString, duration })
        });
        const bay1Data = await checkBay1.json();
        
        let assignedBayId = null;
        if (bay1Data.available && bay1Data.bayId === 'bay1') {
            assignedBayId = 'bay1';
        } else {
            if (bay1Data.available) {
                assignedBayId = bay1Data.bayId;
            }
        }

        if (assignedBayId) {
            // 2. Book Appointment
            const bookRes = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bayId: assignedBayId,
                    start: dateTimeString,
                    duration,
                    serviceType: formData.serviceType,
                    customerName: formData.name,
                    customerPhone: formData.phone,
                    customerEmail: formData.email,
                    vehicle: `${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`
                })
            });
            const bookData = await bookRes.json();

            if (bookData.status === 'confirmed') {
                // Update UI - Create local date object for immediate display
                // new Date("2024-11-25T14:00:00") creates a local date at 14:00, matching the user's intent
                const start = new Date(dateTimeString);
                const end = new Date(start.getTime() + duration * 3600000);
                
                addAppointment({
                    id: bookData.eventId, 
                    bayId: assignedBayId, 
                    start, 
                    end,
                    serviceType: formData.serviceType as ServiceType, 
                    customerName: formData.name, 
                    customerPhone: formData.phone,
                    customerEmail: formData.email,
                    vehicleMake: formData.vehicleMake, 
                    vehicleModel: formData.vehicleModel, 
                    vehicleYear: formData.vehicleYear
                });
                
                setStatus('success');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                onLogRequest(`Denied: ${formData.name}, Booking Failed: ${bookData.error || 'Unknown'}`);
                setStatus('denied');
            }
        } else {
            onLogRequest(`Denied: ${formData.name}, Slot Unavailable`);
            setStatus('denied');
        }
    } catch (error) {
        console.error("Booking error", error);
        setStatus('denied');
    }
  };

  const handleChange = (e: any) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="mb-6"><h2 className="text-2xl font-bold">Request Service</h2></div>
      {status === 'success' ? (
        <div className="bg-green-50 p-8 text-center rounded-lg text-green-800"><CheckCircle className="mx-auto mb-2"/>Confirmed! Check your email.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'denied' && <div className="bg-red-50 p-4 text-red-800 flex gap-2 rounded"><AlertCircle/> Slot Unavailable or Error</div>}
          
          <input type="text" name="name" required placeholder="Name" onChange={handleChange} className="p-2 border rounded w-full" />
          
          <div className="grid grid-cols-2 gap-4">
             <input type="text" name="phone" required placeholder="Phone" onChange={handleChange} className="p-2 border rounded w-full" />
             <input type="email" name="email" required placeholder="Email Address" onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             <input type="text" name="vehicleYear" placeholder="Year" onChange={handleChange} className="p-2 border rounded w-full" />
             <input type="text" name="vehicleMake" placeholder="Make" onChange={handleChange} className="p-2 border rounded w-full" />
             <input type="text" name="vehicleModel" placeholder="Model" onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
          <select name="serviceType" onChange={handleChange} className="p-2 border rounded w-full">
              {SERVICES.map(s => <option key={s.id} value={s.name}>{s.name} - ${s.price}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
             <input type="date" name="date" required onChange={handleChange} className="p-2 border rounded w-full" />
             <select name="time" required onChange={handleChange} value={formData.time} className="p-2 border rounded w-full">
                <option value="">Select Time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{formatTimeDisplay(time)}</option>
                ))}
             </select>
          </div>
          <button type="submit" disabled={status === 'loading'} className="w-full bg-brand-blue text-white py-3 rounded font-bold flex justify-center gap-2">
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
            {status === 'loading' ? 'Processing...' : 'Book Appointment'}
          </button>
        </form>
      )}
    </div>
  );
};
export default ServiceRequestForm;
