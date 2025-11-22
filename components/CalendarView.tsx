import React from 'react';
import { Appointment, ServiceType } from '../types';
import { BAYS, OPERATING_HOURS } from '../constants';
import { formatDate } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  appointments: Appointment[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, currentDate, onDateChange }) => {
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };
  const hours = Array.from({ length: OPERATING_HOURS.end - OPERATING_HOURS.start }, (_, i) => i + OPERATING_HOURS.start);
  const getAppointmentsForBay = (bayId: string) => appointments.filter(apt => apt.bayId === bayId && apt.start.toDateString() === currentDate.toDateString());

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-brand-blue" /> Service Schedule</h2>
        <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-1">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-md transition shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-medium min-w-[150px] text-center">{formatDate(currentDate)}</span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-md transition shadow-sm"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="flex-none w-16 pt-8">
          {hours.map(hour => <div key={hour} className="h-16 text-xs text-gray-400 text-right pr-2 -mt-2">{hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</div>)}
        </div>
        {BAYS.map(bay => (
          <div key={bay.id} className="flex-1 min-w-[200px]">
            <div className="bg-gray-50 p-2 text-center font-semibold border-b mb-2 rounded-t-lg text-brand-gray">{bay.name}</div>
            <div className="relative h-[640px] bg-gray-50 rounded-lg border border-gray-100">
                {hours.map((_, i) => <div key={i} className="h-16 border-b border-gray-200 w-full" />)}
                {getAppointmentsForBay(bay.id).map(apt => {
                   const durationHrs = (apt.end.getTime() - apt.start.getTime()) / 3600000;
                   const top = ((apt.start.getHours() - OPERATING_HOURS.start) * 60 + apt.start.getMinutes()) * (64 / 60);
                   let bgColor = 'bg-blue-100 border-blue-300 text-blue-800';
                   if (apt.serviceType === ServiceType.FAULT_DIAGNOSIS) bgColor = 'bg-red-100 border-red-300 text-red-800';
                   if (apt.serviceType === ServiceType.ANNUAL_INSPECTION) bgColor = 'bg-purple-100 border-purple-300 text-purple-800';
                   return (
                     <div key={apt.id} style={{ top: `${top}px`, height: `${durationHrs * 64}px` }} className={`absolute w-full p-1 border-l-4 text-xs rounded shadow-sm overflow-hidden ${bgColor}`}>
                        <div className="font-bold truncate">{apt.serviceType}</div>
                        <div className="truncate">{apt.customerName}</div>
                        {apt.vehicleMake && <div className="truncate text-[10px] opacity-75">{apt.vehicleYear} {apt.vehicleMake}</div>}
                     </div>
                   );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CalendarView;