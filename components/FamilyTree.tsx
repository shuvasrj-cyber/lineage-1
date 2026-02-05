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
import { RELATION_LABELS } from '../constants';

interface FamilyTreeProps {
  members: Member[];
  relations: Relation[];
}

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  photo?: string;
  gender: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends SimulationLinkDatum<Node> {
  type: RelationType;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, relations }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 100,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes: Node[] = members.map((m: Member) => ({
      id: m.id,
      name: m.name,
      photo: m.photo,
      gender: m.gender,
    }));

    const links: Link[] = relations.map((r: Relation) => ({
      source: r.fromId,
      target: r.toId,
      type: r.type,
    }));

    const g = svg.append('g');

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    const isPartner = (type: RelationType) => type === RelationType.SHREEMAN || type === RelationType.SHREEMATI;
    const isSibling = (type: RelationType) => 
      type === RelationType.DAJU || 
      type === RelationType.BHAI || 
      type === RelationType.DIDI || 
      type === RelationType.BAHINI;

    const simulation = forceSimulation<Node>(nodes)
      .alphaDecay(0.06)
      .velocityDecay(0.4)
      .force('link', forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance((d: Link) => {
          if (isPartner(d.type)) return 100;
          if (isSibling(d.type)) return 120;
          return 250;
        })
        .strength(1)
      )
      .force('charge', forceManyBody().strength(-1500).distanceMax(600))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', forceCollide().radius(110).iterations(1))
      .force('y', forceY().strength(0.05));

    const linkGroup = g.append('g').attr('class', 'links');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const link = linkGroup
      .selectAll('g')
      .data(links)
      .enter()
      .append('g');

    link.append('line')
      .attr('stroke', (d: Link) => {
        if (isPartner(d.type)) return '#f472b6';
        if (isSibling(d.type)) return '#60a5fa';
        return '#cbd5e1';
      })
      .attr('stroke-width', (d: Link) => isPartner(d.type) ? 6 : 2)
      .attr('stroke-dasharray', (d: Link) => {
        if (isPartner(d.type) || isSibling(d.type)) return 'none';
        return '5 3';
      });

    link.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -12)
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .style('pointer-events', 'none')
      .text((d: Link) => RELATION_LABELS[d.type]);

    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(drag<SVGGElement, Node>()
        .on('start', (event: any, d: Node) => {
          if (!event.active) simulation.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: any, d: Node) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: any, d: Node) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append('circle')
      .attr('r', 45)
      .attr('fill', '#fff')
      .attr('stroke', (d: Node) => d.gender === 'female' ? '#ec4899' : d.gender === 'male' ? '#3b82f6' : '#94a3b8')
      .attr('stroke-width', 4);

    const defs = svg.append('defs');
    defs.append('clipPath')
      .attr('id', 'circle-clip')
      .append('circle')
      .attr('r', 40);

    node.append('image')
      .attr('xlink:href', (d: Node) => d.photo || 'https://via.placeholder.com/80?text=👤')
      .attr('x', -40)
      .attr('y', -40)
      .attr('width', 80)
      .attr('height', 80)
      .attr('clip-path', 'url(#circle-clip)')
      .attr('preserveAspectRatio', 'xMidYMid slice');

    node.append('text')
      .attr('y', 65)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0f172a')
      .attr('font-weight', '900')
      .attr('font-size', '13px')
      .style('pointer-events', 'none')
      .text((d: Node) => d.name);

    simulation.on('tick', () => {
      links.forEach((d: any) => {
        if (isPartner(d.type)) {
          const avgY = (d.source.y + d.target.y) / 2;
          d.source.y += (avgY - d.source.y) * 0.15;
          d.target.y += (avgY - d.target.y) * 0.15;
        }
      });

      link.selectAll('line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      link.selectAll('text')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      
      if (simulation.alpha() < 0.01) {
        simulation.stop();
      }
    });

    return () => {
      simulation.stop();
    };
  }, [members, relations, dimensions]);

  return (
    <div className="relative w-full h-full bg-[#f8fafc] overflow-hidden border-2 border-slate-200 rounded-3xl tree-container shadow-2xl">
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl z-10 flex flex-col gap-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1 mb-1">संकेत</h4>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div> 
          <span className="text-xs font-black text-slate-700">पुरुष</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-pink-500 rounded-full"></div> 
          <span className="text-xs font-black text-slate-700">महिला</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-1.5 bg-pink-400 rounded-full"></div> 
          <span className="text-xs font-black text-slate-700">जोडी (Partner)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-1 bg-blue-400 rounded-full"></div> 
          <span className="text-xs font-black text-slate-700">दाजु/भाइ/दिदी/बहिनी</span>
        </div>
      </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
    </div>
  );
};

export default FamilyTree;
