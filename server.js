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
    // Treat the input string as UTC to do math, then strip the Z to keep it abstract
    // This prevents Node.js from shifting the time based on the server's local timezone
    const dateObj = new Date(startString.endsWith('Z') ? startString : startString + 'Z');
    const endDateObj = new Date(dateObj.getTime() + durationHours * 3600000);
    
    // Return strings without 'Z', representing local wall time
    return {
        start: dateObj.toISOString().replace('Z', ''),
        end: endDateObj.toISOString().replace('Z', '')
    };
}

// --- API Endpoints ---

// Check Availability
app.post('/api/availability', async (req, res) => {
  try {
    const { start, duration } = req.body;
    // Calculate window maintaining abstract time
    const { start: timeMin, end: timeMax } = calculateTimeWindow(start, duration);

    // Query Google Calendar FreeBusy API
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin + 'Z', // Fallback to treating it as UTC if strict ISO needed, but relying on timeZone
        timeMax: timeMax + 'Z', 
        timeZone: 'America/New_York', 
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

    // Calculate end time string
    const { start: startStr, end: endStr } = calculateTimeWindow(start, duration);

    const event = {
      summary: `${serviceType} - ${customerName}`,
      description: `Phone: ${customerPhone}\nEmail: ${customerEmail}\nVehicle: ${vehicle}`,
      start: { 
        dateTime: startStr, // Sending "2023-11-25T14:00:00" (Floating)
        timeZone: 'America/New_York' // Telling Google "That string is NY time"
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
