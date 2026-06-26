import React from 'react';
import RenderPageContent from './RenderPageContent';

export default function CanvasContainer({ viewMode, setViewMode, activePage, sections, activeSectionId, setActiveSectionId }) {
  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. Device View Resizer Control Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 bg-[#13151c] px-4 py-2 rounded-xl border border-[#1f222c] select-none shadow-sm">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider">Route: /{activePage.toLowerCase()}</span>
        
        {/* Sizing Toggles */}
        <div className="flex bg-[#191b24] p-0.5 rounded-lg text-[10px] font-bold border border-slate-800">
          {["Desktop", "Tablet", "Mobile"].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md transition-all duration-200 ${
                viewMode === mode 
                  ? 'bg-[#282b3d] text-white font-extrabold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        
        {/* Decorative indicator mimicking the template icon option in the image */}
        <div className="w-3.5 h-3.5 rounded bg-slate-700/50 border border-slate-600/30"></div>
      </div>

      {/* 2. Responsive Viewport Preview Frame Window */}
      <div 
        className={`bg-[#0d0e12] border border-[#1f222c] shadow-2xl rounded-2xl p-8 min-h-[520px] text-white transition-all duration-300 ease-in-out overflow-y-auto ${
          viewMode === 'Desktop' ? 'w-full max-w-3xl' : viewMode === 'Tablet' ? 'w-[520px]' : 'w-[340px]'
        }`}
      >
        {/* Navigation Bar inside the client's rendered template */}
        <div className="border-b border-slate-800 pb-3 mb-6 flex justify-between items-center text-[11px] text-slate-400 font-medium select-none">
          <span className="font-bold text-purple-400 tracking-wide">✨ AuraBuild Active Render</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">About</span>
            <span className="hover:text-white cursor-pointer">Projects</span>
          </div>
        </div>

        {/* 3. Render Stack Container */}
        <div className="space-y-4">
          {sections && sections.length > 0 ? (
            sections.map((section) => (
              <div
                key={section.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSectionId(section.id);
                }}
                className={`relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer my-2
                  ${section.id === activeSectionId 
                    ? 'border-purple-500 bg-purple-500/5' 
                    : 'border-transparent hover:border-slate-800 hover:border-dashed'}`}
              >
                {section.id === activeSectionId && (
                  <span className="absolute -top-2.5 left-3 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-md">
                    Active: {section.section_type}
                  </span>
                )}
                <RenderPageContent section={section} />
              </div>
            ))
          ) : (
            <div className="text-center py-24 text-xs text-slate-500 italic font-medium">
              No canvas layouts found. Add template nodes via the Django Admin.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
