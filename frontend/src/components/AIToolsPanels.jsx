import React from 'react';

export function ContentGenerator({ onSubmit }) {
  const templates = [
    "Generate an 'About Me' story focusing on full-stack web and mobile application development.",
    "Add an executive summary emphasizing IoT and hardware-software integration.",
    "Draft a professional CTA block for freelance project invitations."
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Content Generation Library</h4>
      <p className="text-[11px] text-slate-400">Select an optimized structural blueprint to pipe text straight into Gemini:</p>
      <div className="space-y-2">
        {templates.map((tmpl, idx) => (
          <button 
            key={idx} 
            onClick={() => onSubmit(tmpl)}
            className="w-full text-left p-2.5 bg-[#181a24] hover:bg-[#1e212f] border border-[#232635] text-[11px] text-slate-300 rounded-xl transition-all"
          >
            💡 {tmpl}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ImageCustomizer({ section }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Asset Context Manager</h4>
      <div className="p-3 bg-[#181a24] border border-[#232635] rounded-xl space-y-2">
        <label className="block text-[9px] font-black text-slate-400 uppercase">Banner Image URL</label>
        <input 
          type="text" 
          placeholder="https://images.unsplash.com/photo-..." 
          className="w-full bg-[#0d0e12] border border-[#2d3142] rounded-lg p-2 text-xs text-white outline-none" 
        />
        <div className="text-[9px] text-slate-500 italic">Dynamic background matching overrides applied via theme hooks.</div>
      </div>
    </div>
  );
}

export function BrandThemes({ onSelect }) {
  const themes = [
    { name: "Aura Purple", primary: "bg-purple-600", bg: "bg-[#0d0e12]" },
    { name: "Cyber Emerald", primary: "bg-emerald-500", bg: "bg-[#080f0a]" },
    { name: "Nordic Slate", primary: "bg-blue-500", bg: "bg-[#0f172a]" }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Workspace Themes</h4>
      <div className="grid grid-cols-1 gap-2">
        {themes.map((t, idx) => (
          <button 
            key={idx}
            className="flex items-center justify-between p-2.5 bg-[#181a24] border border-[#232635] rounded-xl hover:border-purple-500 transition-all text-xs text-left"
          >
            <span>{t.name}</span>
            <div className="flex gap-1">
              <span className={`w-3 h-3 rounded-full ${t.primary}`}></span>
              <span className={`w-3 h-3 rounded-full ${t.bg} border border-slate-700`}></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CodeExport({ pages }) {
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "aurabuild_portfolio_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Production Output</h4>
      <p className="text-[11px] text-slate-400">Compile your relational SQLite matrix segments into unified production-ready JSON config templates.</p>
      <button 
        onClick={exportJSON}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg"
      >
        📦 Export Blueprint Configuration
      </button>
    </div>
  );
}
