import React, { useState, useEffect } from 'react';
import { ContentGenerator, ImageCustomizer, BrandThemes, CodeExport } from './AIToolsPanels';

export default function AIRefinementPanel({ logs, onSubmitPrompt, selectedSection, onManualUpdate, activeTool, pages }) {
  const [inputVal, setInputVal] = useState("");
  const [headingInput, setHeadingInput] = useState("");
  const [subheadingInput, setSubheadingInput] = useState("");

  useEffect(() => {
    if (selectedSection?.content_data) {
      // Intelligently fallback fields depending on which structure layout type is loaded
      setHeadingInput(selectedSection.content_data.heading || selectedSection.content_data.title || "");
      setSubheadingInput(selectedSection.content_data.subheading || "");
    }
  }, [selectedSection]);

  const handleManualSaveTrigger = () => {
    if (selectedSection) {
      if (selectedSection.section_type === 'hero') {
        onManualUpdate(selectedSection.id, {
          ...selectedSection.content_data,
          heading: headingInput,
          subheading: subheadingInput
        });
      } else if (selectedSection.section_type === 'projects_grid') {
        onManualUpdate(selectedSection.id, {
          ...selectedSection.content_data,
          title: headingInput
        });
      }
    }
  };

  return (
    <aside className="w-80 bg-[#13151c] border-l border-[#1f222c] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-5 overflow-y-auto flex-1 pb-4">
        
        {/* Dynamic Context Router Matrix panels */}
        {activeTool === 'generator' && <ContentGenerator onSubmit={onSubmitPrompt} />}
        {activeTool === 'image' && <ImageCustomizer section={selectedSection} />}
        {activeTool === 'themes' && <BrandThemes />}
        {activeTool === 'export' && <CodeExport pages={pages} />}

        {/* Default Selection Component Section Inspector View */}
        {!activeTool && (
          <>
            <div className="border-b border-[#1f222c] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">⚡ Section Inspector</h3>
              <p className="text-[10px] text-slate-500">
                {selectedSection ? `Editing target: [${selectedSection.section_type.toUpperCase()}]` : "Select a component block to customize"}
              </p>
            </div>

            {selectedSection ? (
              <div className="space-y-3 bg-[#181a24] p-3 rounded-xl border border-[#232635]">
                
                {/* HERO BLOCK ATTRIBUTES */}
                {selectedSection.section_type === 'hero' && (
                  <>
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Heading Title</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0d0e12] border border-[#2d3142] rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
                        value={headingInput}
                        onChange={(e) => setHeadingInput(e.target.value)}
                        onBlur={handleManualSaveTrigger}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Subheading Copy</label>
                      <textarea 
                        rows="3"
                        className="w-full bg-[#0d0e12] border border-[#2d3142] rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 resize-none"
                        value={subheadingInput}
                        onChange={(e) => setSubheadingInput(e.target.value)}
                        onBlur={handleManualSaveTrigger}
                      />
                    </div>
                  </>
                )}

                {/* PROJECTS GRID BLOCK ATTRIBUTES */}
                {selectedSection.section_type === 'projects_grid' && (
                  <div>
                    <label className="block text-[9px] uppercase font-black text-slate-400 mb-1">Grid Header Title</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0d0e12] border border-[#2d3142] rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
                      value={headingInput}
                      onChange={(e) => setHeadingInput(e.target.value)}
                      onBlur={handleManualSaveTrigger}
                    />
                  </div>
                )}

                <div className="text-[9px] text-slate-500 text-right italic">Changes save automatically on click-away</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic text-center py-6">Click any section layout block in the preview pane to display parameters here.</div>
            )}
          </>
        )}

        {/* AI Action Execution Feed Logs */}
        <div className="space-y-2 pt-2 border-t border-[#1f222c]">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Generation Log</div>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {logs.length > 0 ? logs.map(log => (
              <div key={log.id} className="p-2 bg-[#181a24] border border-[#232635] rounded-lg text-[11px]">
                <div className="font-semibold text-slate-300">{log.desc}</div>
                <div className="text-[9px] text-emerald-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {log.status}
                </div>
              </div>
            )) : (
              <div className="text-[10px] text-slate-600 italic">No prompt operations recorded in this execution run context.</div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Command Prompt Field Tray */}
      <div className="border-t border-[#1f222c] pt-3">
        <div className="bg-[#181a24] rounded-lg border border-[#232635] px-3 py-2 flex items-center gap-2 focus-within:border-purple-500/50">
          <input 
            type="text" 
            placeholder={selectedSection ? "Ask AI to rewrite this block..." : "Select a section to prompt AI..."}
            disabled={!selectedSection}
            className="w-full bg-transparent text-xs outline-none text-slate-200 disabled:opacity-40"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && inputVal.trim()) {
                onSubmitPrompt(inputVal);
                setInputVal("");
              }
            }}
          />
          <button 
            onClick={() => { if(inputVal.trim()) { onSubmitPrompt(inputVal); setInputVal(""); } }}
            disabled={!selectedSection}
            className="text-xs text-purple-400 hover:text-white disabled:opacity-30"
          >
            ⚡
          </button>
        </div>
      </div>
    </aside>
  );
}
