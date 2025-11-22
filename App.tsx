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
  const { connected, connect, disconnect, analyserNode, appointments, addAppointment, logs, addLogEntry, currentDate, setCurrentDate } = useLiveScheduler();
  const [showLogs, setShowLogs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">B</div><span className="text-xl font-bold text-brand-gray">Bill Mitchell Auto</span></div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="hover:text-brand-blue">Services</a><a href="#team" className="hover:text-brand-blue">Team</a><a href="#contact" className="hover:text-brand-blue">Contact</a>
            <button onClick={() => setShowLogs(!showLogs)} className="hover:text-brand-blue flex items-center gap-1"><FileText className="w-4 h-4"/> Logs</button>
          </nav>
          <div className="hidden md:block text-right text-xs text-gray-500"><div className="font-bold text-brand-red">Call Us Today</div><div>{CONTACT_INFO.phone}</div></div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Care for <br/>Your Vehicle</h1>
            <p className="text-blue-200 text-lg mb-8 max-w-lg">Expert mechanics, state-of-the-art diagnostics, and trusted service.</p>
            <div className="flex gap-4">
              <button onClick={connected ? disconnect : connect} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg ${connected ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-white text-blue-900'}`}>
                {connected ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />} {connected ? 'Stop' : 'Talk to Schedule'}
              </button>
              <a href="#request-service" className="px-6 py-3 border border-white/30 rounded-full font-semibold hover:bg-white/10">Book Online</a>
            </div>
            {connected && (
              <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-yellow-300 animate-pulse">Please say hello to start the conversation</span><div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div></div>
                <Visualizer isListening={connected} analyserNode={analyserNode} />
              </div>
            )}
          </div>
          <div id="services" className="flex-1 max-w-md">
             <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Settings className="text-blue-400" /> Popular Services</h3>
               <ul className="space-y-3">{SERVICES.map(s => <li key={s.id} className="flex justify-between p-3 bg-white/5 rounded"><span>{s.name}</span><span className="text-blue-300 font-mono">${s.price}</span></li>)}</ul>
             </div>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8"><CalendarView appointments={appointments} currentDate={currentDate} onDateChange={setCurrentDate} /></div>
          <div className="space-y-8">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="text-brand-blue" /> Hours</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="flex justify-between"><span>{d}</span><span className="font-medium">8:00 AM - 6:00 PM</span></div>)}
                  <div className="flex justify-between text-brand-red"><span>Sun</span><span>Closed</span></div>
                </div>
             </div>
             {showLogs && (
               <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-blue">
                 <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><Phone className="text-green-600" /> Logs</h3></div>
                 <div className="max-h-64 overflow-y-auto space-y-3 no-scrollbar">{logs.map(l => <div key={l.id} className="p-3 bg-gray-50 rounded border text-sm"><div className="text-xs text-gray-400">{l.timestamp.toLocaleTimeString()}</div><p>{l.summary}</p></div>)}</div>
               </div>
             )}
          </div>
        </div>
        <div id="request-service" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div><h2 className="text-3xl font-bold mb-4">Cant Talk?</h2><p className="text-lg text-gray-600 mb-6">Book online instantly.</p></div>
            <ServiceRequestForm onLogRequest={addLogEntry} appointments={appointments} addAppointment={addAppointment}/>
        </div>
        <div id="team"><TeamSection /></div>
        <div id="testimonials"><Testimonials /></div>
      </main>

      <footer id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Visit Us</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4"><MapPin className="text-brand-red" /><div><div className="text-white">Address</div><div>{CONTACT_INFO.address}</div></div></div>
                <div className="flex items-center gap-4"><Phone className="text-brand-red" /><div><div className="text-white">Phone</div><div>{CONTACT_INFO.phone}</div></div></div>
              </div>
            </div>
            <div className="h-64 bg-gray-800 rounded-xl overflow-hidden"><iframe src={CONTACT_INFO.mapUrl} width="100%" height="100%" style={{border:0}} title="map"></iframe></div>
        </div>
      </footer>
    </div>
  );
};
export default App;