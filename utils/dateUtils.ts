import { OPERATING_HOURS, SERVICES } from '../constants';
import { Appointment } from '../types';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const isSlotAvailable = (
  start: Date,
  durationHours: number,
  bayId: string,
  appointments: Appointment[]
): boolean => {
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  
  if (start.getHours() < OPERATING_HOURS.start || end.getHours() > OPERATING_HOURS.end) {
    return false;
  }
  if (start.getDay() === 0) return false; 

  return !appointments.some(appt => {
    if (appt.bayId !== bayId) return false;
    return start < appt.end && end > appt.start;
  });
};

export const getServiceDuration = (serviceName: string): number => {
    const service = SERVICES.find(s => s.name === serviceName);
    return service ? service.durationHours : 1;
};