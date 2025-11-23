import React, { useState } from 'react';
import { SERVICES } from '../constants';
import { ServiceType, Appointment } from '../types';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { isSlotAvailable, getServiceDuration } from '../utils/dateUtils';

interface ServiceRequestFormProps {
  onLogRequest: (summary: string) => void;
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ onLogRequest, appointments, addAppointment }) => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', serviceType: SERVICES[0].name, date: '', time: '', vehicleMake: '', vehicleModel: '', vehicleYear: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'denied'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(start.getTime())) return alert("Invalid Date");
    const duration = getServiceDuration(formData.serviceType);
    const end = new Date(start.getTime() + duration * 3600000);

    let assignedBayId = null;
    if (isSlotAvailable(start, duration, 'bay1', appointments)) assignedBayId = 'bay1';
    else if (isSlotAvailable(start, duration, 'bay2', appointments)) assignedBayId = 'bay2';

    if (assignedBayId) {
      addAppointment({
        id: Math.random().toString(36).substring(7), bayId: assignedBayId, start, end,
        serviceType: formData.serviceType as ServiceType, 
        customerName: formData.name, 
        customerPhone: formData.phone,
        customerEmail: formData.email,
        vehicleMake: formData.vehicleMake, vehicleModel: formData.vehicleModel, vehicleYear: formData.vehicleYear
      });
      onLogRequest(`Online Booking: ${formData.name}, ${formData.serviceType}`);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      onLogRequest(`Denied: ${formData.name}, Slot Unavailable`);
      setStatus('denied');
    }
  };

  const handleChange = (e: any) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="mb-6"><h2 className="text-2xl font-bold">Request Service</h2></div>
      {status === 'success' ? (
        <div className="bg-green-50 p-8 text-center rounded-lg text-green-800"><CheckCircle className="mx-auto mb-2"/>Confirmed!</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === 'denied' && <div className="bg-red-50 p-4 text-red-800 flex gap-2 rounded"><AlertCircle/> Slot Unavailable</div>}
          <div className="grid grid-cols-2 gap-4">
             <input type="text" name="name" required placeholder="Name" onChange={handleChange} className="p-2 border rounded w-full" />
             <input type="text" name="phone" required placeholder="Phone" onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
          <input type="email" name="email" required placeholder="Email Address" onChange={handleChange} className="p-2 border rounded w-full" />
          
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
             <input type="time" name="time" required onChange={handleChange} className="p-2 border rounded w-full" />
          </div>
          <button type="submit" className="w-full bg-brand-blue text-white py-3 rounded font-bold flex justify-center gap-2"><Send className="w-4 h-4"/> Book</button>
        </form>
      )}
    </div>
  );
};
export default ServiceRequestForm;