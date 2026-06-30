import React from 'react';

export default function LeftNavSidebar({ pages, activePage, setActivePage, onSelectTool, activeTool }) {
    return (
        <aside className="w-60 bg-[#13151c] border-r border-[#1f222c] p-4 flex flex-col justify-between shrink-0 select-none z-10">
            <div className="space-y-6">

                {/* PAGES TREE BLOCK */}
                <div>
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2.5 px-1">Pages</div>
                    <div className="space-y-1">
                        {pages.map((page, index) => {
                            const pageName = typeof page === 'object' ? page.name : page;
                            const uniqueKey = typeof page === 'object' && page.id ? `page-${page.id}` : `page-idx-${index}`;

                            return (
                                <button 
                                    key={uniqueKey}
                                    onClick={() => {
                                        setActivePage(pageName);
                                        // ⚡ Completely reset tool selections when switching pages to clear state conflict
                                        onSelectTool(null);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                                        activePage === pageName && !activeTool
                                            ? 'bg-purple-600/10 border border-purple-500/30 text-white shadow-sm font-bold'
                                            : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#181a24]'
                                    }`}
                                >
                                    <span>📂</span> {pageName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* AI TOOLS OPERATION BLOCKS */}
                <div>
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-2.5 px-1">AI Tools</div>
                    <div className="space-y-1">
                        {[
                            { id: 'generator', name: '✨ Content Generator' },
                            { id: 'image', name: '🖼️ Image Customizer' },
                            { id: 'themes', name: '🎨 Brand Themes' },
                            { id: 'export', name: '</> Code Export' }
                        ].map((tool) => (
                            <button 
                                key={tool.id}
                                onClick={() => onSelectTool(tool.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                                    activeTool === tool.id
                                        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/10'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#181a24]'
                                }`}
                            >
                                {tool.name}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Version Stamp Footer */}
            <div className="text-[10px] text-slate-600 font-medium tracking-wide border-t border-[#1f222c] pt-3 px-1">
                AuraBuild v1.0.0
            </div>
        </aside>
    );
}
