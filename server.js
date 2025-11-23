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

// --- API Endpoints ---

// Check Availability
app.post('/api/availability', async (req, res) => {
  try {
    const { start, duration } = req.body;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 3600000);

    // Query Google Calendar FreeBusy API
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: 'America/New_York', // Enforce NY Timezone
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

    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + duration * 3600000);

    const event = {
      summary: `${serviceType} - ${customerName}`,
      description: `Phone: ${customerPhone}\nEmail: ${customerEmail}\nVehicle: ${vehicle}`,
      start: { 
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York' // Set event timezone
      },
      end: { 
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York' // Set event timezone
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // Also log to sheets
    // Columns: Log Date, Log Time, Summary, Appt Date, Appt Time, Phone, Email
    await logToSheet({
      summary: `Booked: ${customerName}, ${serviceType}`,
      apptDate: startDate.toLocaleDateString(),
      apptTime: startDate.toLocaleTimeString(),
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
    // Headers (Implicit): Date, Time, Summary, Appt Date, Appt Time, Phone, Email
    const values = [[
      now.toLocaleDateString(), 
      now.toLocaleTimeString(), 
      data.summary || '',
      data.apptDate || '',
      data.apptTime || '',
      data.phone || '',
      data.email || ''
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:G', // Updated range to capture more columns
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