
import React, { useState, useEffect } from 'react';
import { Member, Relation, RelationType, AppView } from './types';
import { db } from './db';
import MemberForm from './components/MemberForm';
import RelationLinker from './components/RelationLinker';
import FamilyTree from './components/FamilyTree';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [members, setMembers] = useState<Member[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        await db.init();
        const [m, r] = await Promise.all([
          db.getAllMembers(),
          db.getAllRelations()
        ]);
        setMembers(m || []);
        setRelations(r || []);
      } catch (error) {
        console.error("Data loading failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddMember = async (newMember: Member, relation?: { toId: string; type: RelationType }) => {
    try {
      await db.addMember(newMember);
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);

      if (relation) {
        const newRel: Relation = {
          id: crypto.randomUUID(),
          fromId: newMember.id,
          toId: relation.toId,
          type: relation.type
        };
        await db.addRelation(newRel);
        setRelations([...relations, newRel]);
      }
      setView('home');
    } catch (e) {
      alert("सुरक्षित गर्न सकिएन।");
    }
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    try {
      await db.updateMember(updatedMember);
      setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
      setEditingMember(null);
      setView('home');
    } catch (e) {
      alert("अद्यावधिक गर्न सकिएन।");
    }
  };

  const handleLinkMembers = async (fromId: string, toId: string, type: RelationType) => {
    try {
      const newRel: Relation = {
        id: crypto.randomUUID(),
        fromId,
        toId,
        type
      };
      await db.addRelation(newRel);
      setRelations([...relations, newRel]);
      setView('home');
    } catch (e) {
      alert("सम्बन्ध सुरक्षित गर्न सकिएन।");
    }
  };

  const startEditing = (member: Member) => {
    setEditingMember(member);
    setView('edit_member');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-800 font-bold animate-pulse">वंशावली लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-slate-50 overflow-hidden">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 shadow-xl flex items-center justify-between shrink-0 z-30">
        <h1 className="text-xl font-black flex items-center gap-2">
          <span className="bg-white rounded-lg p-1 text-xl shadow-inner">👨‍👩‍👧‍👦</span> वंशावली रेकर्ड
        </h1>
        <div className="text-xs bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 font-bold">
          {members.length} सदस्यहरू
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6 relative">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <h2 className="text-3xl font-extrabold mb-2 tracking-tight">नमस्ते! 👋</h2>
              <p className="opacity-80 font-medium mb-6">आफ्नो वंशको इतिहास यहाँ सुरक्षित गर्नुहोस्।</p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setView('add_member')}
                  className="bg-white text-blue-800 px-8 py-3 rounded-2xl font-black shadow-lg hover:shadow-white/20 active:scale-95 transition-all"
                >
                  + नयाँ सदस्य
                </button>
                <button 
                  onClick={() => setView('tree_view')}
                  className="bg-blue-400/20 backdrop-blur-md text-white border-2 border-white/40 px-8 py-3 rounded-2xl font-black hover:bg-white/10 transition-all"
                >
                  रेखाचित्र हेर्नुहोस्
                </button>
              </div>
            </div>

            <div className="sticky top-0 z-20 pt-2 pb-4 bg-slate-50">
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                 <input 
                   type="text" 
                   placeholder="सदस्यको नाम खोज्नुहोस्..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm outline-none focus:border-blue-400 transition-all text-slate-700 font-bold"
                 />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border-4 border-dashed border-slate-200">
                   <span className="text-6xl block mb-4 grayscale opacity-50">📂</span>
                   <p className="text-slate-400 font-black text-lg">कुनै सदस्य भेटिएन।</p>
                </div>
              ) : (
                filteredMembers.map(member => (
                  <div key={member.id} className="bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-50 flex items-center gap-5 hover:shadow-xl hover:border-blue-100 transition-all group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border-4 border-slate-50 group-hover:border-blue-50 transition-all shadow-inner">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100">👤</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 text-lg leading-tight">{member.name}</h3>
                      <p className="text-sm text-slate-400 font-bold mt-0.5">{member.address || 'ठेगाना थपिएको छैन'}</p>
                      <div className="flex items-center justify-between mt-2">
                         <span className="text-xs text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">{member.mobile || 'फोन उपलब्ध छैन'}</span>
                         <button 
                           onClick={() => startEditing(member)}
                           className="text-xs font-black text-slate-400 hover:text-blue-600 transition p-2 bg-slate-50 rounded-lg"
                         >
                           विवरण सच्याउनुहोस् ✏️
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'add_member' && (
          <MemberForm 
            onSave={handleAddMember} 
            existingMembers={members} 
            onCancel={() => setView('home')} 
          />
        )}

        {view === 'edit_member' && editingMember && (
          <MemberForm 
            onSave={handleUpdateMember} 
            existingMembers={members.filter(m => m.id !== editingMember.id)} 
            onCancel={() => {
              setEditingMember(null);
              setView('home');
            }} 
            initialData={editingMember}
            isEdit={true}
          />
        )}

        {view === 'link_members' && (
          <RelationLinker 
            members={members} 
            onLink={handleLinkMembers} 
            onCancel={() => setView('home')} 
          />
        )}

        {view === 'tree_view' && (
          <div className="h-full">
            <FamilyTree members={members} relations={relations} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-2 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50 rounded-t-[2rem]">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center p-3 px-6 rounded-2xl transition-all duration-300 ${view === 'home' || view === 'edit_member' ? 'text-blue-700 bg-blue-50 scale-110 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">घर</span>
        </button>
        <button 
          onClick={() => setView('add_member')}
          className={`flex flex-col items-center p-3 px-6 rounded-2xl transition-all duration-300 ${view === 'add_member' ? 'text-blue-700 bg-blue-50 scale-110 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span className="text-2xl">➕</span>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">थप्नुहोस्</span>
        </button>
        <button 
          onClick={() => setView('link_members')}
          className={`flex flex-col items-center p-3 px-6 rounded-2xl transition-all duration-300 ${view === 'link_members' ? 'text-blue-700 bg-blue-50 scale-110 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span className="text-2xl">🔗</span>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">नाता जोड्नुहोस्</span>
        </button>
        <button 
          onClick={() => setView('tree_view')}
          className={`flex flex-col items-center p-3 px-6 rounded-2xl transition-all duration-300 ${view === 'tree_view' ? 'text-blue-700 bg-blue-50 scale-110 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span className="text-2xl">🌳</span>
          <span className="text-[10px] font-black uppercase tracking-tighter mt-1">चित्र</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
