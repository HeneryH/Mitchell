import { Service, ServiceType, Bay, TeamMember, Testimonial } from './types';

export const CALENDAR_IDS = {
  BAY_1: '27f018994f9455e1ab137d5ed78ad92248c57989b5e9978ec08ffee402bcf521@group.calendar.google.com',
  BAY_2: '3145ac069ae08a5a0d9b902bb135227c52e5c1ae728e2cde1cfbd1aebd0741b1@group.calendar.google.com'
};

export const SHEET_ID = '1eEGbrkgXYlr_nqoYITerV3bpn_0Bd_5cS8sfxFb-04Y';

export const CONTACT_INFO = {
  phone: '(215) 822-1056',
  address: '57 Bristol Rd, Chalfont, PA',
  mapUrl: 'https://maps.google.com/maps?q=57+Bristol+Rd,+Chalfont,+PA&t=&z=15&ie=UTF8&iwloc=&output=embed'
};

export const BAYS: Bay[] = [
  { id: 'bay1', name: 'Service Bay 1', calendarId: CALENDAR_IDS.BAY_1 },
  { id: 'bay2', name: 'Service Bay 2', calendarId: CALENDAR_IDS.BAY_2 }
];

export const SERVICES: Service[] = [
  { id: 's1', name: ServiceType.OIL_CHANGE, durationHours: 1, price: 49.99 },
  { id: 's2', name: ServiceType.ANNUAL_INSPECTION, durationHours: 2, price: 99.99 },
  { id: 's3', name: ServiceType.FAULT_DIAGNOSIS, durationHours: 3, price: 149.99 },
  { id: 's4', name: ServiceType.TIRE_SERVICE, durationHours: 1, price: 39.99 }
];

export const OPERATING_HOURS = {
  start: 8, // 8:00 AM
  end: 18   // 6:00 PM
};

export const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const SYSTEM_INSTRUCTION = `You are the friendly and efficient AI receptionist for Bill Mitchell Auto.
Your goal is to help customers schedule appointments for their vehicles.

Services available:
- Oil Change (1 hr)
- Annual Inspection (2 hrs)
- Fault Diagnosis (3 hrs)
- Tire Service (1 hr)

We have two service bays. Operating hours are Monday to Saturday, 8:00 AM to 6:00 PM.

INSTRUCTIONS:
1. Start with: "Hello! Thanks for calling Bill Mitchell Auto. This is your AI assistant. How can I help you schedule service today?"
2. Once the user responds to your greeting, ask for their name and what service they need.
3. Ask for their vehicle details: Make, Model, and Year (if known).
4. Ask for a preferred date and time.
5. Use the 'checkAvailability' tool to see if a bay is free. IMPORTANT: When calling this tool, strictly convert the user's relative time (e.g., "tomorrow at 2pm") to an ISO 8601 date string (e.g., "2023-10-27T14:00:00").
6. If free, use 'bookAppointment' to confirm.
7. If not free, suggest the nearest available slot.
8. After booking, confirm the details and mention a confirmation email and reminder will be sent 24h prior.
9. Use 'logCall' to record a summary of the conversation at the end.

Be concise, professional, and warm. Do not make up availability; always check using the tool.
If a tool returns an error, politely ask the user to repeat the information.`;

export const TEAM: TeamMember[] = [
  {
    id: 't1',
    name: 'Bill Mitchell',
    role: 'Master Mechanic & Owner',
    bio: 'With over 30 years of experience, Bill started this shop with a passion for American muscle and a dedication to honest service.',
    imageUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 't2',
    name: 'Sarah Jenkins',
    role: 'Lead Diagnostics',
    bio: 'Sarah specializes in modern computerized engine systems and hybrid vehicle maintenance.',
    imageUrl: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 't3',
    name: 'Mike Ross',
    role: 'Tire & Suspension Specialist',
    bio: 'Mike ensures your ride is smooth and safe. He is certified in all major tire brands and suspension systems.',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982d0f?auto=format&fit=crop&q=80&w=400'
  }
];

export const CUSTOMER_TESTIMONIALS: Testimonial[] = [
  {
    id: 'tm1',
    name: 'James Peterson',
    quote: 'Best service in town. They diagnosed a rattle that two other shops couldn\'t find. Highly recommended!',
    rating: 5
  },
  {
    id: 'tm2',
    name: 'Linda Martinez',
    quote: 'Professional, clean waiting area, and they explained everything clearly without trying to upsell me.',
    rating: 5
  },
  {
    id: 'tm3',
    name: 'Robert Chen',
    quote: 'Quick scheduling and fair prices. The new voice assistant is actually pretty cool too.',
    rating: 4
  }
];