import React from 'react';
import HeroBlock from '../canvas_blocks/HeroBlock';

// New dynamic block component for project cards matching your engineering focus
function ProjectsGridBlock({ data }) {
  const projectItems = data.projects || [
    { title: "Prahari Safety System", desc: "Hardware tracking integration loop with dedicated GPS nodes." },
    { title: "Smart Tourist Monitor", desc: "Geofencing alert platform using Django and React mapping matrices." }
  ];

  return (
    <div className="py-6 px-2 space-y-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-purple-400">
        {data.title || "Featured Projects"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {projectItems.map((proj, idx) => (
          <div key={idx} className="p-4 bg-[#13151c] border border-[#1f222c] rounded-xl hover:border-purple-500/50 transition-all space-y-1.5">
            <h4 className="text-xs font-bold text-white">{proj.title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">{proj.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RenderPageContent({ section }) {
  const data = section.content_data || {};

  switch (section.section_type) {
    case 'hero':
      return <HeroBlock data={data} />;
      
    case 'projects_grid':
      return <ProjectsGridBlock data={data} />;
      
    default:
      return (
        <div className="p-4 border border-dashed border-slate-800 text-center text-xs text-slate-500 rounded-xl">
          Unrecognized Layout Block Layer: {section.section_type}
        </div>
      );
  }
}
