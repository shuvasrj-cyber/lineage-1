
import React, { useState, useRef } from 'react';
import { Member, RelationType } from '../types';
import { RELATION_LIST } from '../constants';

interface MemberFormProps {
  onSave: (member: Member, relation?: { toId: string; type: RelationType }) => void;
  existingMembers: Member[];
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ onSave, existingMembers, onCancel }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [photo, setPhoto] = useState<string | undefined>();
  const [relatedTo, setRelatedTo] = useState('');
  const [relationType, setRelationType] = useState<RelationType>(RelationType.CHHORA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('कृपया नाम राख्नुहोस्');

    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      address,
      mobile,
      gender,
      photo,
      createdAt: Date.now(),
    };

    const relation = relatedTo ? { toId: relatedTo, type: relationType } : undefined;
    onSave(newMember, relation);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 border-b pb-2">नयाँ सदस्य थप्नुहोस्</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-blue-200 cursor-pointer overflow-hidden hover:border-blue-400 transition-colors"
          >
            {photo ? (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <span className="text-3xl">📷</span>
                <p className="text-xs mt-1">फोटो छान्नुहोस्</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">पूरा नाम *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg outline-none"
              placeholder="उदा. राम बहादुर थापा"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">ठेगाना</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg outline-none"
              placeholder="उदा. काठमाडौं, नेपाल"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">मोबाइल नम्बर</label>
            <input 
              type="tel" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg outline-none"
              placeholder="९८XXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">लिङ्ग</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value as any)}
              className="mt-1 w-full px-4 py-2 border rounded-lg outline-none"
            >
              <option value="male">पुरुष</option>
              <option value="female">महिला</option>
              <option value="other">अन्य</option>
            </select>
          </div>
        </div>

        {existingMembers.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3">नाता सम्बन्ध जोड्नुहोस्</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select 
                  value={relatedTo} 
                  onChange={(e) => setRelatedTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                >
                  <option value="">सदस्य छान्नुहोस्...</option>
                  {existingMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select 
                  disabled={!relatedTo}
                  value={relationType} 
                  onChange={(e) => setRelationType(e.target.value as RelationType)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-sm disabled:opacity-50"
                >
                  {RELATION_LIST.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">सुरक्षित गर्नुहोस्</button>
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-300 font-bold rounded-xl text-gray-600">रद्द गर्नुहोस्</button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
