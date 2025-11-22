import React from 'react';
import { TEAM } from '../constants';
import { Users } from 'lucide-react';

const TeamSection: React.FC = () => {
  return (
    <div className="bg-white py-12 rounded-xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
           <Users className="w-8 h-8 text-brand-blue" /> Meet the Team
        </h2>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Our certified experts are dedicated to keeping your vehicle running at its best.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {TEAM.map(member => (
          <div key={member.id} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 group">
            <div className="h-48 overflow-hidden">
               <img 
                 src={member.imageUrl} 
                 alt={member.name} 
                 className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
               />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <div className="text-brand-red font-medium text-sm mb-3 uppercase tracking-wide">{member.role}</div>
              <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;