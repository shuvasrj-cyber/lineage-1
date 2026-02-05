
import React, { useEffect, useRef, useState } from 'react';
import { 
  select, 
  zoom, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  forceY, 
  drag,
  SimulationNodeDatum,
  SimulationLinkDatum
} from 'd3';
import { Member, Relation, RelationType } from '../types';
import { getInferredRelation, resolveDirectRelationship, generateAIPrompt } from '../logic/relationMapper';
import { GoogleGenAI } from "@google/genai";

interface FamilyTreeProps {
  members: Member[];
  relations: Relation[];
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (id: string) => void;
  onEditRelation?: (relation: Relation) => void;
}

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  photo?: string;
  gender: string;
  address: string;
  mobile: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends SimulationLinkDatum<Node> {
  id: string;
  source: string | Node;
  target: string | Node;
  type: RelationType;
  label: string; 
  isReverse?: boolean;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, relations, onEditMember, onDeleteMember, onEditRelation }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedMember, setSelectedMember] = useState<Node | null>(null);
  const [targetMember, setTargetMember] = useState<Node | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight - 100 });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const findRelationPath = (m1Id: string, m2Id: string) => {
    const adj: Record<string, { to: string, type: RelationType }[]> = {};
    members.forEach(m => adj[m.id] = []);
    
    relations.forEach(r => {
      adj[r.toId].push({ to: r.fromId, type: r.type });
      let invType: RelationType | null = null;
      const tG = members.find(m => m.id === r.toId)?.gender;
      if (r.type === RelationType.BUWA || r.type === RelationType.AMA) invType = tG === 'female' ? RelationType.CHHORI : RelationType.CHHORA;
      else if (r.type === RelationType.CHHORA || r.type === RelationType.CHHORI) invType = tG === 'female' ? RelationType.AMA : RelationType.BUWA;
      else if (r.type === RelationType.SHREEMAN) invType = RelationType.SHREEMATI;
      else if (r.type === RelationType.SHREEMATI) invType = RelationType.SHREEMAN;
      
      if (invType) adj[r.fromId].push({ to: r.toId, type: invType });
    });

    const queue = [{ id: m1Id, path: [] as RelationType[], nodes: [m1Id] }];
    const visited = new Set([m1Id]);
    while(queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.id === m2Id) {
        const membersInPath = curr.nodes.map(id => members.find(m => m.id === id)!);
        const target = members.find(m => m.id === m2Id)!;
        return { path: curr.path, membersInPath, targetMember: target };
      }
      for (const edge of adj[curr.id] || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ id: edge.to, path: [...curr.path, edge.type], nodes: [...curr.nodes, edge.to] });
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!selectedMember || !targetMember) {
      setAiResult(null);
      return;
    }
    const pathInfo = findRelationPath(selectedMember.id, targetMember.id);
    if (!pathInfo) {
      setAiResult("नाता भेटिएन।");
      return;
    }

    const runAI = async () => {
      setIsAnalyzing(true);
      try {
        const direct = resolveDirectRelationship(pathInfo.path, pathInfo.membersInPath, pathInfo.targetMember.gender);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const prompt = generateAIPrompt(pathInfo.path, pathInfo.membersInPath, pathInfo.targetMember);
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiResult(response.text || direct);
      } catch (error) {
        setAiResult("सम्बन्ध विश्लेषणमा त्रुटि भयो।");
      } finally {
        setIsAnalyzing(false);
      }
    };
    runAI();
  }, [selectedMember, targetMember]);

  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();
    svg.on('contextmenu', (e) => e.preventDefault());

    const nodes: Node[] = members.map((m: Member) => ({
      id: m.id, name: m.name, photo: m.photo, gender: m.gender, address: m.address, mobile: m.mobile
    }));

    const links: Link[] = [];
    relations.forEach((r: Relation) => {
      const from = members.find(m => m.id === r.fromId);
      const to = members.find(m => m.id === r.toId);
      if (!from || !to) return;

      links.push({ 
        id: r.id,
        source: r.fromId, 
        target: r.toId, 
        type: r.type, 
        label: getInferredRelation(from, to, r.type, false),
        isReverse: false 
      });
      
      links.push({ 
        id: r.id,
        source: r.fromId, 
        target: r.toId, 
        type: r.type, 
        label: getInferredRelation(from, to, r.type, true), 
        isReverse: true 
      });
    });

    const g = svg.append('g');
    const zoomBehavior = zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on('zoom', (event: any) => g.attr('transform', event.transform));
    svg.call(zoomBehavior as any);

    const simulation = forceSimulation<Node>(nodes)
      .alphaDecay(0.04)
      .force('link', forceLink<Node, Link>(links).id(d => d.id).distance(450).strength(0.6))
      .force('charge', forceManyBody().strength(-12000))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', forceCollide().radius(280))
      .force('y', forceY().strength(0.1));

    const linkLayer = g.append('g').attr('class', 'links');
    const nodeLayer = g.append('g').attr('class', 'nodes');

    const linkHitZone = linkLayer.selectAll('line.hitbox')
      .data(links.filter(l => !l.isReverse))
      .enter().append('line')
      .attr('class', 'hitbox')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 40)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const rel = relations.find(r => r.id === d.id);
        if (rel) onEditRelation?.(rel);
      });

    const linkLine = linkLayer.selectAll('line.visible')
      .data(links.filter(l => !l.isReverse))
      .enter().append('line')
      .attr('class', 'visible')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 6)
      .attr('opacity', 0.4)
      .style('pointer-events', 'none');

    const linkText = linkLayer.selectAll('text').data(links).enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.isReverse ? '#94a3b8' : '#334155')
      .attr('font-size', '11px')
      .attr('font-weight', '900')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(255,255,255,0.8)');

    const node = nodeLayer.selectAll('g').data(nodes).enter().append('g')
      .style('cursor', 'grab')
      .call(drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.2).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }) as any)
      .on('click', (event: any, d: Node) => {
        if (!selectedMember) {
          setSelectedMember(d);
        } else if (selectedMember.id === d.id) {
          setSelectedMember(null);
          setTargetMember(null);
        } else {
          setTargetMember(d);
        }
      });

    node.append('circle').attr('r', 75).attr('fill', '#fff').attr('stroke', d => d.gender === 'female' ? '#f472b6' : '#60a5fa').attr('stroke-width', 8).attr('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.1))');
    node.append('clipPath').attr('id', (d, i) => `clip-${i}`).append('circle').attr('r', 67);
    node.append('image')
      .attr('xlink:href', d => d.photo || 'https://via.placeholder.com/150?text=👤')
      .attr('x', -67).attr('y', -67).attr('width', 134).attr('height', 134)
      .attr('clip-path', (d, i) => `url(#clip-${i})`)
      .attr('preserveAspectRatio', 'xMidYMid slice');

    // Name Label
    node.append('text').attr('y', 105).attr('text-anchor', 'middle').attr('fill', '#0f172a').attr('font-weight', '900').attr('font-size', '19px').text(d => d.name);
    
    // Address Label
    node.append('text').attr('y', 124).attr('text-anchor', 'middle').attr('fill', '#64748b').attr('font-weight', '700').attr('font-size', '12px').text(d => d.address ? `📍 ${d.address}` : '📍 विवरण छैन');
    
    // Mobile Label
    node.append('text').attr('y', 140).attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-weight', '600').attr('font-size', '11px').text(d => d.mobile ? `📞 ${d.mobile}` : '');

    simulation.on('tick', () => {
      linkLine
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkHitZone
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText.each(function(d: any) {
        const text = select(this);
        const sX = d.source.x;
        const sY = d.source.y;
        const tX = d.target.x;
        const tY = d.target.y;
        const dx = tX - sX;
        const dy = tY - sY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const labelWithArrow = d.isReverse ? `${d.label} →` : `← ${d.label}`;
        text.text(labelWithArrow);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const finalAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
        const tPos = d.isReverse ? 0.75 : 0.25;
        const offsetDist = 28; 
        const nx = -dy / len;
        const ny = dx / len;
        const px = sX + dx * tPos + offsetDist * nx;
        const py = sY + dy * tPos + offsetDist * ny;
        text.attr('x', px).attr('y', py).attr('transform', `rotate(${finalAngle}, ${px}, ${py})`);
      });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      
      node.select('circle')
        .attr('stroke-width', d => (selectedMember?.id === d.id || targetMember?.id === d.id) ? 14 : 8)
        .attr('stroke', d => {
          if (selectedMember?.id === d.id) return '#10b981';
          if (targetMember?.id === d.id) return '#f59e0b';
          return d.gender === 'female' ? '#f472b6' : '#60a5fa';
        });
    });

    return () => simulation.stop();
  }, [members, relations, dimensions, selectedMember, targetMember]);

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden rounded-3xl border-2 border-slate-100">
      <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-5 rounded-3xl border-2 border-slate-100 shadow-xl z-10 pointer-events-none max-w-[280px]">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">स्मार्ट वंशावली</h4>
        <div className="space-y-1.5">
          <p className="text-[12px] text-slate-700 font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> १ पटक थिच्नुहोस्: सदस्य छान्नुहोस्</p>
          <p className="text-[12px] text-slate-700 font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> २ पटक थिच्नुहोस्: नाता विश्लेषण</p>
          <p className="text-[12px] text-slate-700 font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 bg-slate-300 rounded-full"></span> लाइनमा थिच्नुहोस्: नाता सच्याउनुहोस्</p>
        </div>
      </div>

      {selectedMember && (
        <div className="absolute bottom-28 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-20 animate-in slide-in-from-bottom-6 duration-500">
           <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border-2 border-white/50 relative">
              <button onClick={() => {setSelectedMember(null); setTargetMember(null);}} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-xl p-2">✕</button>
              
              {!targetMember ? (
                <div className="text-center py-2">
                   <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm overflow-hidden">
                      <img src={selectedMember.photo || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" alt="" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900">{selectedMember.name}</h3>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">बाट नाता खोज्न अर्को सदस्य रोज्नुहोस्</p>
                   <div className="grid grid-cols-2 gap-3 mt-8">
                      <button onClick={() => onEditMember?.(members.find(m => m.id === selectedMember.id)!)} className="py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs border border-blue-100 shadow-sm active:scale-95 transition">विवरण हेर्नुहोस्</button>
                      <button onClick={() => onDeleteMember?.(selectedMember.id)} className="py-4 bg-red-50 text-red-700 rounded-2xl font-black text-xs border border-red-100 shadow-sm active:scale-95 transition">मेटाउनुहोस्</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-6">
                      <div className="text-center">
                         <div className="w-12 h-12 rounded-xl bg-emerald-50 mb-1 border-2 border-white overflow-hidden mx-auto shadow-sm">
                            <img src={selectedMember.photo || 'https://via.placeholder.com/48'} className="w-full h-full object-cover" alt="" />
                         </div>
                         <p className="text-[10px] font-black text-emerald-600 uppercase">Source</p>
                         <p className="text-xs font-black text-slate-800">{selectedMember.name}</p>
                      </div>
                      <div className="text-3xl animate-bounce">🧬</div>
                      <div className="text-center">
                         <div className="w-12 h-12 rounded-xl bg-amber-50 mb-1 border-2 border-white overflow-hidden mx-auto shadow-sm">
                            <img src={targetMember.photo || 'https://via.placeholder.com/48'} className="w-full h-full object-cover" alt="" />
                         </div>
                         <p className="text-[10px] font-black text-amber-600 uppercase">Target</p>
                         <p className="text-xs font-black text-slate-800">{targetMember.name}</p>
                      </div>
                   </div>
                   
                   <div className="bg-indigo-900 rounded-[2rem] p-8 text-white text-center shadow-2xl relative overflow-hidden min-h-[160px] flex flex-col justify-center border-4 border-white/10">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-4">
                           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white border-r-2 opacity-80"></div>
                           <p className="text-xs font-black uppercase opacity-60 tracking-widest">नाता विश्लेषण हुँदैछ...</p>
                        </div>
                      ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                           <p className="text-[11px] font-black opacity-40 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">वंशावली विश्लेषण परिणाम</p>
                           <h4 className="text-4xl font-black mb-1">{aiResult}</h4>
                           <p className="text-xs font-bold opacity-60 mt-2">एआई द्वारा संचालित विश्लेषण</p>
                        </div>
                      )}
                   </div>
                   <button onClick={() => setTargetMember(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-inner border border-slate-200 active:scale-95 transition">अर्को सदस्य रोज्नुहोस्</button>
                </div>
              )}
           </div>
        </div>
      )}

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
    </div>
  );
};

export default FamilyTree;
