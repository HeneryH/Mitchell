
import React, { useState } from 'react';
import { Mic, MicOff, Phone, Calendar, Clock, Settings, FileText, Menu, X, MapPin } from 'lucide-react';
import { useLiveScheduler } from './hooks/useLiveScheduler';
import CalendarView from './components/CalendarView';
import Visualizer from './components/Visualizer';
import ServiceRequestForm from './components/ServiceRequestForm';
import TeamSection from './components/TeamSection';
import Testimonials from './components/Testimonials';
import { SERVICES, OPERATING_HOURS, CONTACT_INFO } from './constants';

const App: React.FC = () => {
  const { 
    connected, 
    connect, 
    disconnect, 
    analyserNode, 
    appointments, 
    addAppointment,
    logs, 
    addLogEntry,
    currentDate, 
    setCurrentDate 
  } = useLiveScheduler();
  
  const [showLogs, setShowLogs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="text-xl font-bold text-brand-gray">Bill Mitchell Auto</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-gray-600 hover:text-brand-blue font-medium">Services</a>
            <a href="#team" className="text-gray-600 hover:text-brand-blue font-medium">Team</a>
            <a href="#contact" className="text-gray-600 hover:text-brand-blue font-medium">Contact</a>
            <button onClick={() => setShowLogs(!showLogs)} className="text-gray-600 hover:text-brand-blue flex items-center gap-1">
              <FileText className="w-4 h-4" /> Logs
            </button>
          </nav>

          <div className="hidden md:block">
             <div className="text-right text-xs text-gray-500">
                <div className="font-bold text-brand-red">Call Us Today</div>
                <div>{CONTACT_INFO.phone}</div>
             </div>
          </div>

           {/* Mobile Menu Button */}
           <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
           </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Professional Care for <br/>Your Vehicle
            </h1>
            <p className="text-blue-200 text-lg mb-8 max-w-lg">
              Expert mechanics, state-of-the-art diagnostics, and trusted service for over 20 years.
            </p>
            <div className="flex gap-4">
              <button 
                 onClick={connected ? disconnect : connect}
                 className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${
                   connected 
                     ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                     : 'bg-white text-blue-900 hover:bg-blue-50'
                 }`}
              >
                {connected ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {connected ? 'Stop Voice Assistant' : 'Talk to Schedule'}
              </button>
              <a href="#request-service" className="px-6 py-3 border border-white/30 rounded-full font-semibold hover:bg-white/10 transition text-center flex items-center justify-center">
                Book Online
              </a>
            </div>

            {/* Active Assistant Visualization */}
            {connected && (
              <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-yellow-300 uppercase tracking-wider animate-pulse">Please say hello to start the conversation</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <Visualizer isListening={connected} analyserNode={analyserNode} />
              </div>
            )}
          </div>
          
          <div id="services" className="flex-1 w-full max-w-md">
             {/* Services Card */}
             <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                 <Settings className="w-5 h-5 text-blue-400" /> Popular Services
               </h3>
               <ul className="space-y-3">
                 {SERVICES.map(s => (
                   <li key={s.id} className="flex justify-between items-center p-3 bg-white/5 rounded hover:bg-white/10 transition">
                     <span>{s.name}</span>
                     <span className="text-blue-300 font-mono text-sm">${s.price}</span>
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full space-y-20">
        
        {/* Scheduler & Logs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scheduler (Takes 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <CalendarView 
              appointments={appointments} 
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          </div>

          {/* Right Column: Info & Logs */}
          <div className="space-y-8">
             {/* Operating Hours */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-blue" /> Hours of Operation
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                     <div key={day} className="flex justify-between">
                       <span>{day}</span>
                       <span className="font-medium text-gray-900">8:00 AM - 6:00 PM</span>
                     </div>
                  ))}
                  <div className="flex justify-between text-brand-red">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
             </div>

             {/* Call Logs */}
             {showLogs && (
               <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-blue animate-fade-in">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" /> System Logs
                    </h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live Updates</span>
                 </div>
                 <div className="max-h-64 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                    {logs.length === 0 ? (
                      <p className="text-gray-400 text-sm italic text-center py-4">No activity logged yet.</p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded border text-sm">
                          <div className="text-xs text-gray-400 mb-1">{log.timestamp.toLocaleTimeString()}</div>
                          <p className="text-gray-700">{log.summary}</p>
                        </div>
                      ))
                    )}
                 </div>
               </div>
             )}
             
             {/* Mock Info for Reviewer */}
             <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 border border-blue-200">
               <strong>Demo Mode Information:</strong><br/>
               This app uses a local in-memory simulation of the Google Calendars (IDs: 27f0... and 3145...) to ensure instant functionality for this demo without OAuth setup.
               <br/><br/>
               Try saying: <em>"I need an oil change for tomorrow at 10am."</em>
             </div>
          </div>
        </div>

        {/* Online Request Section */}
        <div id="request-service" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Cant Talk Right Now?</h2>
              <p className="text-lg text-gray-600 mb-6">Use our express online booking form to secure your spot. We'll confirm via email shortly after your request.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue"><Clock className="w-5 h-5"/></div>
                  <div>
                    <div className="font-semibold">Quick Turnaround</div>
                    <div className="text-sm">Most services completed same-day</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue"><Calendar className="w-5 h-5"/></div>
                  <div>
                    <div className="font-semibold">Flexible Scheduling</div>
                    <div className="text-sm">Choose a time that works for you</div>
                  </div>
                </div>
              </div>
            </div>
            <ServiceRequestForm 
              onLogRequest={addLogEntry} 
              appointments={appointments}
              addAppointment={addAppointment}
            />
        </div>

        {/* Team Section */}
        <div id="team">
          <TeamSection />
        </div>

        {/* Testimonials Section */}
        <div id="testimonials">
          <Testimonials />
        </div>

      </main>

      {/* Footer / Contact Section */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            
            {/* Contact Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Visit Us Today</h3>
                <p className="text-gray-400 mb-8 max-w-sm">
                  We are conveniently located in Chalfont, PA. Stop by for an inspection or call us to schedule an appointment.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Address</div>
                    <div className="text-gray-400">{CONTACT_INFO.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Phone</div>
                    <div className="text-gray-400">{CONTACT_INFO.phone}</div>
                  </div>
                </div>
                
                 <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Open Hours</div>
                    <div className="text-gray-400">Mon-Sat: 8:00 AM - 6:00 PM</div>
                    <div className="text-gray-500 text-sm">Sun: Closed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Widget */}
            <div className="h-64 md:h-full min-h-[300px] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
              <iframe 
                src={CONTACT_INFO.mapUrl}
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Bill Mitchell Auto Location"
              ></iframe>
            </div>

          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 Bill Mitchell Auto. All rights reserved.</p>
            <p className="mt-2">Powered by Gemini 2.5 Live API</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
