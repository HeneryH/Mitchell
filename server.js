import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
// Serve static files from the build directory
app.use(express.static('dist'));

// Configuration
const CALENDAR_IDS = {
  bay1: '27f018994f9455e1ab137d5ed78ad92248c57989b5e9978ec08ffee402bcf521@group.calendar.google.com',
  bay2: '3145ac069ae08a5a0d9b902bb135227c52e5c1ae728e2cde1cfbd1aebd0741b1@group.calendar.google.com'
};
const SHEET_ID = '1eEGbrkgXYlr_nqoYITerV3bpn_0Bd_5cS8sfxFb-04Y';

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets'
  ],
});

const calendar = google.calendar({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Helper: Calculate end time while preserving wall-clock values
// Input: "2023-11-25T14:00:00" -> Output: { start: "2023-11-25T14:00:00", end: "2023-11-25T15:00:00" }
function calculateTimeWindow(startString, durationHours) {
    try {
        // 1. Extract strict "YYYY-MM-DDTHH:MM:SS" part to ignore any offsets the AI might send
        let cleanStart = startString;
        const match = startString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (match) {
            cleanStart = match[1];
        }

        // 2. Treat as UTC for math (prevents local server offset issues)
        const dateObj = new Date(cleanStart + 'Z');
        if (isNaN(dateObj.getTime())) throw new Error("Invalid Date Format");

        const endDateObj = new Date(dateObj.getTime() + durationHours * 3600000);
        
        // 3. Return ISO strings WITHOUT 'Z' (Wall Clock Time)
        return {
            start: dateObj.toISOString().replace('Z', ''),
            end: endDateObj.toISOString().replace('Z', '')
        };
    } catch (e) {
        throw new Error(`Date processing failed: ${startString}`);
    }
}

// Helper: Convert NY Wall Time to UTC ISO String for FreeBusy Query
// This is critical because FreeBusy requires UTC, but we have "2pm NY"
function getUtcFromNyTime(dateStr) {
    // 1. Parse as if it were UTC to get the raw numbers (e.g. 14:00 UTC)
    const cleanStr = dateStr.replace(/Z$/, '');
    const pseudoUtc = new Date(cleanStr + 'Z'); 
    
    // 2. See what that instant (14:00 UTC) looks like in NY (e.g. 09:00)
    const nyTimeString = pseudoUtc.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyDate = new Date(nyTimeString);
    
    // 3. Calculate offset (14:00 - 09:00 = 5 hours)
    const offsetMs = pseudoUtc.getTime() - nyDate.getTime();
    
    // 4. Add offset to get the UTC time that corresponds to 14:00 NY
    // (14:00 + 5 hours = 19:00 UTC)
    return new Date(pseudoUtc.getTime() + offsetMs).toISOString();
}

// --- API Endpoints ---

// Get Appointments (For Calendar View)
app.get('/api/appointments', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const allEvents = [];

    for (const [bayId, calendarId] of Object.entries(CALENDAR_IDS)) {
      const response = await calendar.events.list({
        calendarId,
        timeMin: start,
        timeMax: end,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/New_York'
      });

      if (response.data.items) {
        const bayEvents = response.data.items.map(event => {
            const summaryParts = (event.summary || '').split(' - ');
            const serviceType = summaryParts[0] || 'Unknown Service';
            const customerName = summaryParts.slice(1).join(' - ') || 'Unknown Customer';

            const desc = event.description || '';
            const phoneMatch = desc.match(/Phone: (.*)/);
            const emailMatch = desc.match(/Email: (.*)/);
            const vehicleMatch = desc.match(/Vehicle: (.*)/);

            return {
                id: event.id,
                bayId: bayId,
                start: event.start.dateTime || event.start.date, 
                end: event.end.dateTime || event.end.date,     
                serviceType: serviceType,
                customerName: customerName,
                customerPhone: phoneMatch ? phoneMatch[1] : '',
                customerEmail: emailMatch ? emailMatch[1] : '',
                vehicleMake: vehicleMatch ? vehicleMatch[1] : '', 
                vehicleModel: '',
                vehicleYear: '' 
            };
        });
        allEvents.push(...bayEvents);
      }
    }
    res.json(allEvents);
  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check Availability
app.post('/api/availability', async (req, res) => {
  try {
    const { start, duration } = req.body;
    
    // 1. Get Wall Clock Strings (e.g. "2024-11-25T14:00:00")
    const { start: startStr, end: endStr } = calculateTimeWindow(start, duration);

    // 2. Convert to strict UTC for FreeBusy Query
    // FreeBusy API requires absolute timeMin/timeMax
    const timeMinUtc = getUtcFromNyTime(startStr);
    const timeMaxUtc = getUtcFromNyTime(endStr);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMinUtc, 
        timeMax: timeMaxUtc, 
        timeZone: 'America/New_York', // Also hints the response timezone
        items: [{ id: CALENDAR_IDS.bay1 }, { id: CALENDAR_IDS.bay2 }]
      }
    });

    const calendars = response.data.calendars;
    const bay1Busy = calendars[CALENDAR_IDS.bay1].busy.length > 0;
    const bay2Busy = calendars[CALENDAR_IDS.bay2].busy.length > 0;

    if (!bay1Busy) return res.json({ available: true, bayId: 'bay1', message: 'Bay 1 is available.' });
    if (!bay2Busy) return res.json({ available: true, bayId: 'bay2', message: 'Bay 2 is available.' });
    
    return res.json({ available: false, message: 'No slots available.' });
  } catch (error) {
    console.error('Availability Check Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Book Appointment
app.post('/api/book', async (req, res) => {
  try {
    const { bayId, start, duration, serviceType, customerName, customerPhone, customerEmail, vehicle } = req.body;
    const calendarId = CALENDAR_IDS[bayId];
    if (!calendarId) throw new Error('Invalid Bay ID');

    // Calculate end time string (Wall Clock)
    const { start: startStr, end: endStr } = calculateTimeWindow(start, duration);

    const event = {
      summary: `${serviceType} - ${customerName}`,
      description: `Phone: ${customerPhone}\nEmail: ${customerEmail}\nVehicle: ${vehicle}`,
      start: { 
        dateTime: startStr, // e.g. "2024-11-25T14:00:00"
        timeZone: 'America/New_York' // Force Google to treat above string as NY time
      },
      end: { 
        dateTime: endStr,
        timeZone: 'America/New_York'
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // Also log to sheets
    await logToSheet({
      summary: `Booked: ${customerName}, ${serviceType}`,
      apptDate: startStr.split('T')[0],
      apptTime: startStr.split('T')[1],
      phone: customerPhone,
      email: customerEmail
    });

    res.json({ status: 'confirmed', eventId: response.data.id });
  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log Call
app.post('/api/log', async (req, res) => {
  try {
    const { summary } = req.body;
    await logToSheet({ summary });
    res.json({ status: 'logged' });
  } catch (error) {
    console.error('Logging Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function logToSheet(data) {
  try {
    const now = new Date();
    const values = [[
      now.toLocaleDateString('en-US', { timeZone: 'America/New_York' }), 
      now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }), 
      data.summary || '',
      data.apptDate || '',
      data.apptTime || '',
      data.phone || '',
      data.email || ''
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:G', 
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
  } catch (e) {
    console.error("Sheet Log Failed", e);
  }
}

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
