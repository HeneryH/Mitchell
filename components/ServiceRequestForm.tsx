
import React, { useState } from 'react';
import { SERVICES } from '../constants';
import { ServiceType, Appointment } from '../types';
import { Send, Calendar, Clock, User, Phone, Wrench, AlertCircle, CheckCircle, Car } from 'lucide-react';
import { isSlotAvailable, getServiceDuration } from '../utils/dateUtils';

interface ServiceRequestFormProps {
  onLogRequest: (summary: string) => void;
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ onLogRequest, appointments, addAppointment }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    serviceType: SERVICES[0].name,
    date: '',
    time: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'success' | 'denied'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct Date objects
    const start = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(start.getTime())) {
      alert("Invalid Date/Time");
      return;
    }
    
    const duration = getServiceDuration(formData.serviceType);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    // Check Availability
    let assignedBayId = null;
    if (isSlotAvailable(start, duration, 'bay1', appointments)) {
      assignedBayId = 'bay1';
    } else if (isSlotAvailable(start, duration, 'bay2', appointments)) {
      assignedBayId = 'bay2';
    }

    if (assignedBayId) {
      // Slot Available - Book it
      const newAppt: Appointment = {
        id: Math.random().toString(36).substring(7),
        bayId: assignedBayId,
        start,
        end,
        serviceType: formData.serviceType as ServiceType,
        customerName: formData.name,
        customerContact: formData.contact,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear
      };

      addAppointment(newAppt);
      const vehicleInfo = formData.vehicleMake ? `(${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel})` : '';
      onLogRequest(`Online Booking Confirmed: ${formData.name} for ${formData.serviceType} on ${start.toLocaleString()} ${vehicleInfo}.`);
      
      setStatus('success');
      setStatusMessage("Your appointment has been successfully scheduled! A confirmation email has been sent.");
    } else {
      // Slot Unavailable - Deny
      onLogRequest(`Online Booking Denied: ${formData.name} requested unavailable slot ${start.toLocaleString()}.`);
      setStatus('denied');
      setStatusMessage("The requested time slot is unavailable. Please select a different time or date.");
    }

    // Reset Form after delay if success, or keep data if denied so user can change time
    if (assignedBayId) {
      setTimeout(() => {
        setStatus('idle');
        setFormData({
          name: '',
          contact: '',
          serviceType: SERVICES[0].name,
          date: '',
          time: '',
          vehicleMake: '',
          vehicleModel: '',
          vehicleYear: ''
        });
      }, 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'denied') setStatus('idle'); // Clear error when user makes changes
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request Service</h2>
        <p className="text-gray-500">Book your appointment online easily.</p>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Confirmed!</h3>
          <p className="text-green-700">{statusMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {status === 'denied' && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Request Denied</h4>
                  <p className="text-sm">{statusMessage}</p>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Phone className="w-4 h-4" /> Phone / Email
              </label>
              <input
                type="text"
                name="contact"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.contact}
                onChange={handleChange}
                placeholder="(555) 000-0000"
              />
            </div>
          </div>
          
          {/* Vehicle Info */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1 col-span-3 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Car className="w-4 h-4" /> Year
              </label>
              <input
                type="text"
                name="vehicleYear"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.vehicleYear}
                onChange={handleChange}
                placeholder="2020"
              />
            </div>
             <div className="space-y-1 col-span-3 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="w-4"></span> Make
              </label>
              <input
                type="text"
                name="vehicleMake"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.vehicleMake}
                onChange={handleChange}
                placeholder="Ford"
              />
            </div>
             <div className="space-y-1 col-span-3 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                 <span className="w-4"></span> Model
              </label>
              <input
                type="text"
                name="vehicleModel"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.vehicleModel}
                onChange={handleChange}
                placeholder="F-150"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Wrench className="w-4 h-4" /> Service Needed
            </label>
            <select
              name="serviceType"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition bg-white"
              value={formData.serviceType}
              onChange={handleChange}
            >
              {SERVICES.map(s => (
                <option key={s.id} value={s.name}>{s.name} - ${s.price}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Preferred Date
              </label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Preferred Time
              </label>
              <input
                type="time"
                name="time"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue text-white font-bold py-3 rounded-lg hover:bg-blue-900 transition flex items-center justify-center gap-2 mt-4 shadow-md"
          >
            <Send className="w-4 h-4" /> Check Availability & Book
          </button>
        </form>
      )}
    </div>
  );
};

export default ServiceRequestForm;
