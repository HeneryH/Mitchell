
export enum ServiceType {
  OIL_CHANGE = 'Oil Change',
  ANNUAL_INSPECTION = 'Annual Inspection',
  FAULT_DIAGNOSIS = 'Fault Diagnosis',
  TIRE_SERVICE = 'Tire Service'
}

export interface Service {
  id: string;
  name: ServiceType;
  durationHours: number;
  price: number;
}

export interface Appointment {
  id: string;
  bayId: string;
  start: Date;
  end: Date;
  serviceType: ServiceType;
  customerName: string;
  customerContact: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  summary: string;
}

export interface Bay {
  id: string;
  name: string;
  calendarId: string;
}

export type ViewMode = 'landing' | 'scheduler';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  rating: number;
}
