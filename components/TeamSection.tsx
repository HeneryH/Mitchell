import React from 'react';
import { TEAM } from '../constants';
import { Users } from 'lucide-react';

const TeamSection: React.FC = () => (
    <div className="bg-white py-12 rounded-xl">
      <div className="text-center mb-10"><h2 className="text-3xl font-bold flex justify-center gap-2"><Users className="text-brand-blue"/> Meet the Team</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {TEAM.map(m => (
          <div key={m.id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src={m.imageUrl} alt={m.name} className="w-full h-48 object-cover" />
            <div className="p-6"><h3 className="text-xl font-bold">{m.name}</h3><div className="text-brand-red text-sm mb-3">{m.role}</div><p className="text-gray-600 text-sm">{m.bio}</p></div>
          </div>
        ))}
      </div>
    </div>
);
export default TeamSection;