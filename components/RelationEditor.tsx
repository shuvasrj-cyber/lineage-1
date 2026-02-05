import React, { useState } from 'react';
import { Member, Relation, RelationType } from '../types';
import { RELATION_LIST, RELATION_LABELS } from '../constants';

interface RelationEditorProps {
  members: Member[];
  relations: Relation[];
  onUpdate: (relationId: string, newType: RelationType) => void;
  onDelete: (relationId: string) => void;
  onCancel: () => void;
  initialRelation?: Relation;
}

const RelationEditor: React.FC<RelationEditorProps> = ({ members, relations, onUpdate, onDelete, onCancel, initialRelation }) => {
  const [selectedRelId, setSelectedRelId] = useState(initialRelation?.id || '');
  const [newType, setNewType] = useState<RelationType>(initialRelation?.type || RelationType.BUWA);

  const selectedRel = relations.find(r => r.id === selectedRelId);
  const fromMember = members.find(m => m.id === selectedRel?.fromId);
  const toMember = members.find(m => m.id === selectedRel?.toId);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-lg mx-auto border-2 border-indigo-50 mb-24">
      <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-3">
        <span className="text-3xl">⚙️</span> नाता सम्पादन
      </h2>
      
      {!initialRelation && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-500 mb-2">सम्बन्ध छान्नुहोस्:</label>
          <select 
            value={selectedRelId} 
            onChange={(e) => {
              const rel = relations.find(r => r.id === e.target.value);
              setSelectedRelId(e.target.value);
              if (rel) setNewType(rel.type);
            }}
            className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold outline-none"
          >
            <option value="">सम्बन्ध रोज्नुहोस्...</option>
            {relations.map(r => {
              const m1 = members.find(m => m.id === r.fromId);
              const m2 = members.find(m => m.id === r.toId);
              return <option key={r.id} value={r.id}>{m1?.name} -> {m2?.name} ({RELATION_LABELS[r.type]})</option>
            })}
          </select>
        </div>
      )}

      {selectedRel && fromMember && toMember && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
             <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase">From</p>
                   <p className="font-black text-indigo-900">{fromMember.name}</p>
                </div>
                <div className="text-2xl">➡️</div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase">To</p>
                   <p className="font-black text-indigo-900">{toMember.name}</p>
                </div>
             </div>
             <label className="block text-xs font-bold text-indigo-600 mb-2">नयाँ नाता छान्नुहोस्:</label>
             <select 
                value={newType} 
                onChange={(e) => setNewType(e.target.value as RelationType)}
                className="w-full px-4 py-3 border-2 border-white rounded-2xl bg-white font-black text-indigo-700 outline-none shadow-sm"
             >
                {RELATION_LIST.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
             </select>
          </div>

          <div className="grid grid-cols-1 gap-3">
             <button 
                onClick={() => onUpdate(selectedRel.id, newType)}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition"
             >
                परिवर्तन सुरक्षित गर्नुहोस्
             </button>
             <button 
                onClick={() => {
                  if (window.confirm("के तपाईं यो नाता मेटाउन चाहनुहुन्छ?")) onDelete(selectedRel.id);
                }}
                className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl border border-red-100 active:scale-95 transition"
             >
                नाता मेटाउनुहोस्
             </button>
          </div>
        </div>
      )}

      <button onClick={onCancel} className="w-full py-4 mt-6 bg-slate-100 text-slate-500 font-black rounded-2xl">बन्द गर्नुहोस्</button>
    </div>
  );
};

export default RelationEditor;
