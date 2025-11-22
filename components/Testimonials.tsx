import React from 'react';
import { CUSTOMER_TESTIMONIALS } from '../constants';
import { Star, MessageCircle } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <MessageCircle className="w-8 h-8 text-brand-blue" /> Customer Stories
        </h2>
        <p className="text-gray-600 mt-2">Don't just take our word for it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CUSTOMER_TESTIMONIALS.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col relative">
            <div className="absolute -top-3 left-6 bg-brand-blue text-white p-2 rounded-full">
               <span className="text-2xl font-serif leading-none h-4 flex items-center">"</span>
            </div>
            <div className="flex gap-1 mb-4 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <p className="text-gray-700 italic mb-6 flex-grow">"{t.quote}"</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
               <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-xs">
                  {t.name.charAt(0)}
               </div>
               <span className="font-semibold text-sm text-gray-900">{t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;