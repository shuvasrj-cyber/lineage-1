
import React, { useState } from 'react';
import { Member, RelationType } from '../types';
import { RELATION_LIST } from '../constants';

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

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto border border-indigo-100">
      <h2 className="text-2xl font-bold text-indigo-800 mb-6 border-b pb-2">नाता सम्बन्ध जोड्नुहोस्</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">पहिलो सदस्य</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-gray-50 outline-none">
            <option value="">छान्नुहोस्...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">दोस्रो सदस्यको नाता</label>
          <select value={type} onChange={(e) => setType(e.target.value as RelationType)} className="w-full px-4 py-3 border rounded-xl bg-indigo-50 font-bold outline-none">
            {RELATION_LIST.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">दोस्रो सदस्य</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-gray-50 outline-none">
            <option value="">छान्नुहोस्...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={handleLink} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">जोड्नुहोस्</button>
          <button onClick={onCancel} className="px-6 py-3 border border-gray-300 font-bold rounded-xl text-gray-600">बन्द गर्नुहोस्</button>
        </div>
      </div>
    </div>
  );
};

export default RelationLinker;
