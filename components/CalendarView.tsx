
import React from 'react';
import { Bay, Appointment, ServiceType } from '../types';
import { BAYS, OPERATING_HOURS } from '../constants';
import { formatDate, formatTime } from '../utils/dateUtils';
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

  const hours = Array.from(
    { length: OPERATING_HOURS.end - OPERATING_HOURS.start }, 
    (_, i) => i + OPERATING_HOURS.start
  );

  const getAppointmentsForBay = (bayId: string) => {
    return appointments.filter(apt => 
      apt.bayId === bayId && 
      apt.start.toDateString() === currentDate.toDateString()
    );
  };

  const getStyleForAppointment = (apt: Appointment) => {
    const startHour = apt.start.getHours();
    const startMin = apt.start.getMinutes();
    const durationHrs = (apt.end.getTime() - apt.start.getTime()) / (1000 * 60 * 60);
    
    const top = ((startHour - OPERATING_HOURS.start) * 60 + startMin) * (64 / 60); // 64px per hour
    const height = durationHrs * 64;

    // Color coding based on service
    let bgColor = 'bg-blue-100 border-blue-300 text-blue-800';
    if (apt.serviceType === ServiceType.FAULT_DIAGNOSIS) bgColor = 'bg-red-100 border-red-300 text-red-800';
    if (apt.serviceType === ServiceType.ANNUAL_INSPECTION) bgColor = 'bg-purple-100 border-purple-300 text-purple-800';

    return {
      top: `${top}px`,
      height: `${height}px`,
      className: `absolute w-full p-1 border-l-4 text-xs rounded shadow-sm overflow-hidden ${bgColor} hover:z-10 hover:shadow-md transition-shadow`
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-brand-blue" />
          Service Schedule
        </h2>
        <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-1">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-md transition shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium min-w-[150px] text-center">{formatDate(currentDate)}</span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-md transition shadow-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Time Column */}
        <div className="flex-none w-16 pt-8">
          {hours.map(hour => (
            <div key={hour} className="h-16 text-xs text-gray-400 text-right pr-2 -mt-2">
              {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>

        {/* Bays */}
        {BAYS.map(bay => (
          <div key={bay.id} className="flex-1 min-w-[200px]">
            <div className="bg-gray-50 p-2 text-center font-semibold border-b mb-2 rounded-t-lg text-brand-gray">
              {bay.name}
            </div>
            <div className="relative h-[640px] bg-gray-50 rounded-lg border border-gray-100">
                {/* Grid lines */}
                {hours.map((_, i) => (
                  <div key={i} className="h-16 border-b border-gray-200 box-border w-full" />
                ))}
                
                {/* Appointments */}
                {getAppointmentsForBay(bay.id).map(apt => {
                   const style = getStyleForAppointment(apt);
                   const hasVehicleInfo = apt.vehicleMake || apt.vehicleModel;
                   return (
                     <div key={apt.id} style={{ top: style.top, height: style.height }} className={style.className}>
                        <div className="font-bold truncate leading-tight">{apt.serviceType}</div>
                        <div className="truncate leading-tight">{apt.customerName}</div>
                        {hasVehicleInfo && (
                            <div className="truncate text-[10px] opacity-75 mt-0.5">
                                {apt.vehicleYear} {apt.vehicleMake} {apt.vehicleModel}
                            </div>
                        )}
                     </div>
                   );
                })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 flex gap-4">
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> Standard</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div> Inspection</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div> Diagnosis</div>
      </div>
    </div>
  );
};

export default CalendarView;
