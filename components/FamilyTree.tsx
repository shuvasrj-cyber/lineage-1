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

    const nodes: Node[] = members.map(m => ({
      id: m.id,
      name: m.name,
      photo: m.photo,
      gender: m.gender,
    }));

    const links: Link[] = relations.map(r => ({
      source: r.fromId,
      target: r.toId,
      type: r.type,
    }));

    const g = svg.append('g');

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    const simulation = forceSimulation<Node>(nodes)
      .force('link', forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(d => (d.type === RelationType.SHREEMAN || d.type === RelationType.SHREEMATI) ? 80 : 180)
      )
      .force('charge', forceManyBody().strength(-1200))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', forceCollide().radius(70))
      .force('y', forceY().strength(0.05));

    const link = g.append('g')
      .selectAll('g')
      .data(links)
      .enter()
      .append('g');

    link.append('line')
      .attr('stroke', d => (d.type === RelationType.SHREEMAN || d.type === RelationType.SHREEMATI) ? '#f472b6' : '#cbd5e1')
      .attr('stroke-width', d => (d.type === RelationType.SHREEMAN || d.type === RelationType.SHREEMATI) ? 4 : 2)
      .attr('stroke-dasharray', d => (d.type === RelationType.SHREEMAN || d.type === RelationType.SHREEMATI) ? 'none' : '4 2');

    link.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text(d => RELATION_LABELS[d.type]);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    node.append('circle')
      .attr('r', 42)
      .attr('fill', '#fff')
      .attr('stroke', d => d.gender === 'female' ? '#ec4899' : d.gender === 'male' ? '#3b82f6' : '#94a3b8')
      .attr('stroke-width', 3);

    const defs = svg.append('defs');
    nodes.forEach(n => {
      if (n.photo) {
        defs.append('pattern')
          .attr('id', `photo-${n.id}`)
          .attr('width', 1)
          .attr('height', 1)
          .append('image')
          .attr('xlink:href', n.photo)
          .attr('width', 84)
          .attr('height', 84)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      }
    });

    node.append('circle')
      .attr('r', 38)
      .attr('fill', d => d.photo ? `url(#photo-${d.id})` : '#e2e8f0');

    node.append('text')
      .attr('y', 62)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0f172a')
      .attr('font-weight', '800')
      .attr('font-size', '14px')
      .text(d => d.name);

    simulation.on('tick', () => {
      links.forEach((d: any) => {
        if (d.type === RelationType.SHREEMAN || d.type === RelationType.SHREEMATI) {
          const dy = d.target.y - d.source.y;
          d.source.y += dy * 0.05;
          d.target.y -= dy * 0.05;
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
    });

    return () => {
      simulation.stop();
    };
  }, [members, relations, dimensions]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden border rounded-3xl tree-container shadow-inner">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-lg z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded-full border border-blue-700"></div> <span className="text-sm font-bold">पुरुष</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-pink-500 rounded-full border border-pink-700"></div> <span className="text-sm font-bold">महिला</span></div>
      </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block" />
    </div>
  );
};

export default FamilyTree;
