import React, { useState } from 'react';
import { Member, RelationType } from '../types';
import { RELATION_LIST, RELATION_LABELS } from '../constants';

interface RelationLinkerProps {
  members: Member[];
  onLink: (fromId: string, toId: string, type: RelationType) => void;
  onCancel: () => void;
}

const RelationLinker: React.FC<RelationLinkerProps> = ({ members, onLink, onCancel }) => {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [type, setType] = useState<RelationType>(RelationType.BUWA);

  const handleLink = () => {
    if (!fromId || !toId || fromId === toId) {
      alert('कृपया दुई फरक सदस्यहरू छान्नुहोस्।');
      return;
    }
    onLink(fromId, toId, type);
  };

  const fromMemberName = members.find((m: Member) => m.id === fromId)?.name || '...';
  const toMemberName = members.find((m: Member) => m.id === toId)?.name || '...';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto border border-indigo-100 mb-20">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6 border-b pb-2">नाता सम्बन्ध जोड्नुहोस्</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">पहिलो सदस्य (Related From)</label>
          <select value={fromId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromId(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">छान्नुहोस्...</option>
            {members.map((m: Member) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <label className="block text-sm font-semibold text-indigo-800 mb-2">पहिलो सदस्य दोस्रो सदस्यको के नाता पर्ने?</label>
          <select value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as RelationType)} className="w-full px-4 py-3 border rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-400">
            {RELATION_LIST.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">दोस्रो सदस्य (Related To)</label>
          <select value={toId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToId(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">छान्नुहोस्...</option>
            {members.map((m: Member) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {fromId && toId && fromId !== toId && (
          <div className="p-4 bg-indigo-600 rounded-xl text-white shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">सम्बन्ध पुष्टीकरण</p>
            <p className="text-lg font-black mt-1">
              "{fromMemberName}" चाहिँ "{toMemberName}" को "{RELATION_LABELS[type]}" हुन्।
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleLink} 
            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition"
          >
            नाता जोड्नुहोस्
          </button>
          <button 
            onClick={onCancel} 
            className="px-6 py-3 border border-gray-300 font-bold rounded-xl text-gray-600 hover:bg-gray-50"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationLinker;
