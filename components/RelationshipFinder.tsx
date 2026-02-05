
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useMemo } from 'react';
import { Member, Relation, RelationType } from '../types';
import { RELATION_LABELS } from '../constants';
import { resolveDirectRelationship, generateAIPrompt } from '../logic/relationMapper';

interface RelationshipFinderProps {
  members: Member[];
  relations: Relation[];
  onCancel: () => void;
}

const RelationshipFinder: React.FC<RelationshipFinderProps> = ({ members, relations, onCancel }) => {
  const [m1, setM1] = useState('');
  const [m2, setM2] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const result = useMemo(() => {
    if (!m1 || !m2 || m1 === m2) return null;

    const adj: Record<string, { to: string, type: RelationType }[]> = {};
    members.forEach(m => adj[m.id] = []);
    
    relations.forEach(r => {
      const fromMember = members.find(m => m.id === r.fromId);
      const toMember = members.find(m => m.id === r.toId);
      if (!fromMember || !toMember) return;

      // Add forward relation
      adj[r.toId].push({ to: r.fromId, type: r.type });

      // Calculate inverse based on requested pairs
      let invType: RelationType | null = null;
      const tG = toMember.gender;

      if (r.type === RelationType.BUWA || r.type === RelationType.AMA) {
        invType = tG === 'female' ? RelationType.CHHORI : RelationType.CHHORA;
      } else if (r.type === RelationType.CHHORA || r.type === RelationType.CHHORI) {
        invType = tG === 'female' ? RelationType.AMA : RelationType.BUWA;
      } else if (r.type === RelationType.MAMA || r.type === RelationType.MAIJU) {
        invType = tG === 'female' ? RelationType.BHANJI : RelationType.BHANJA;
      } else if (r.type === RelationType.BHANJA || r.type === RelationType.BHANJI) {
        invType = tG === 'female' ? RelationType.MAIJU : RelationType.MAMA;
      } else if (r.type === RelationType.FUPU || r.type === RelationType.FUPAJU) {
        invType = tG === 'female' ? RelationType.BHADAI : RelationType.BHADA;
      } else if (r.type === RelationType.KAKA || r.type === RelationType.KAKI || r.type === RelationType.THULO_BUWA || r.type === RelationType.THULI_AMA) {
        invType = tG === 'female' ? RelationType.BHATIJI : RelationType.BHATIJA;
      } else if (r.type === RelationType.SASURA || r.type === RelationType.SASU) {
        invType = tG === 'female' ? RelationType.BUHARI : RelationType.JWAI;
      } else if (r.type === RelationType.JWAI || r.type === RelationType.BUHARI) {
        invType = tG === 'female' ? RelationType.SASU : RelationType.SASURA;
      } else if (r.type === RelationType.SHREEMAN) {
        invType = RelationType.SHREEMATI;
      } else if (r.type === RelationType.SHREEMATI) {
        invType = RelationType.SHREEMAN;
      } else if (r.type === RelationType.SALO || r.type === RelationType.SALI || r.type === RelationType.JETHAN) {
        invType = RelationType.BHENA;
      } else if (r.type === RelationType.BHENA) {
        invType = tG === 'female' ? RelationType.SALI : RelationType.SALO;
      } else if ([RelationType.DAJU, RelationType.BHAI, RelationType.DIDI, RelationType.BAHINI].includes(r.type)) {
        invType = tG === 'female' ? RelationType.BAHINI : RelationType.BHAI;
      }

      if (invType) adj[r.fromId].push({ to: r.toId, type: invType });
    });

    const queue = [{ id: m1, path: [] as RelationType[], nodes: [m1] }];
    const visited = new Set([m1]);
    while(queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.id === m2) {
        const membersInPath = curr.nodes.map(id => members.find(m => m.id === id)!);
        const targetMember = members.find(m => m.id === m2)!;
        return {
          found: true,
          path: curr.path,
          membersInPath,
          targetMember,
          direct: resolveDirectRelationship(curr.path, membersInPath, targetMember.gender)
        };
      }
      for (const edge of adj[curr.id] || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ id: edge.to, path: [...curr.path, edge.type], nodes: [...curr.nodes, edge.to] });
        }
      }
    }
    return { found: false };
  }, [m1, m2, members, relations]);

  useEffect(() => {
    if (!result?.found || !m1 || !m2) {
      setAiResult(null);
      return;
    }
    const runAI = async () => {
      setIsAnalyzing(true);
      try {
        // Correctly initialize GoogleGenAI with a named parameter using environment variable.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const prompt = generateAIPrompt(result.path!, result.membersInPath!, result.targetMember!);
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiResult(response.text || result.direct);
      } catch (error) {
        setAiResult(result.direct);
      } finally {
        setIsAnalyzing(false);
      }
    };
    runAI();
  }, [result, m1, m2]);

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-lg mx-auto border-2 border-slate-50 mb-24">
      <header className="mb-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-5 shadow-lg">
          <span className="text-4xl">🧬</span>
        </div>
        <h2 className="text-3xl font-black text-slate-800">नाता पहिचान</h2>
        <p className="text-sm font-bold text-slate-400 mt-1">नेपाली वंशावली नियम अनुसार</p>
      </header>
      <div className="space-y-6">
        <select value={m1} onChange={e => setM1(e.target.value)} className="w-full px-6 py-4 border-2 border-slate-100 rounded-[2rem] bg-slate-50 font-black text-slate-700 outline-none focus:border-blue-400">
          <option value="">को बाट?</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="text-center text-2xl">🔍</div>
        <select value={m2} onChange={e => setM2(e.target.value)} className="w-full px-6 py-4 border-2 border-slate-100 rounded-[2rem] bg-slate-50 font-black text-slate-700 outline-none focus:border-blue-400">
          <option value="">को सम्म?</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {m1 && m2 && result && (
          <div className="mt-8 p-8 rounded-[2.5rem] bg-indigo-900 text-white shadow-xl relative overflow-hidden">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-white"></div>
              </div>
            )}
            <div className="text-center relative z-0">
              <p className="text-[10px] font-black uppercase opacity-40 mb-4 border-b border-white/10 pb-2">वंशावली विश्लेषण</p>
              {result.found ? (
                <>
                  <p className="text-sm font-bold text-blue-200">{members.find(m=>m.id===m1)?.name} को</p>
                  <h3 className="text-4xl font-black my-2">{aiResult || 'विश्लेषण...'}</h3>
                  <p className="text-sm font-bold text-blue-200">{members.find(m=>m.id===m2)?.name} हुनुहुन्छ।</p>
                </>
              ) : <p className="font-bold">सम्बन्ध भेटिएन।</p>}
            </div>
          </div>
        )}
        <button onClick={onCancel} className="w-full py-5 bg-slate-100 text-slate-500 font-black rounded-[2rem]">बन्द गर्नुहोस्</button>
      </div>
    </div>
  );
};

export default RelationshipFinder;
