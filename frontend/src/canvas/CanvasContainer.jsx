import React from 'react';
import RenderPageContent from './RenderPageContent';
import { PORTFOLIO_THEMES } from './themes';

export default function CanvasContainer({
    viewMode,
    setViewMode,
    activePage,
    sections,
    activeSectionId,
    setActiveSectionId,
    portfolioTheme
}) {
    const currentTheme = PORTFOLIO_THEMES[portfolioTheme] || PORTFOLIO_THEMES.cyberpunk_neon;

    return ( <
        div className = "w-full flex flex-col items-center" > { /* 1. Device Resizer Control Bar */ } <
        div className = "w-full max-w-3xl flex justify-between items-center mb-4 bg-[#13151c] px-4 py-2 rounded-xl border border-[#1f222c] select-none" >
        <
        span className = "text-[11px] font-bold text-slate-400" > Route: /{activePage ? activePage.toLowerCase() : 'home'}</span >
        <
        div className = "flex bg-[#191b24] p-0.5 rounded-lg text-[10px] font-bold border border-slate-800" > {
            ["Desktop", "Tablet", "Mobile"].map(mode => ( <
                button key = { mode }
                onClick = {
                    () => setViewMode(mode)
                }
                className = { `px-3 py-1 rounded-md transition-all ${viewMode === mode ? 'bg-[#282b3d] text-white font-extrabold' : 'text-slate-400'}` } > { mode } < /button>
            ))
        } <
        /div> <
        div className = "w-3.5 h-3.5 rounded bg-slate-700/50 border border-slate-600/30" > < /div> < /
        div >

        { /* 2. Responsive Preview Frame */ } <
        div className = { `shadow-2xl rounded-2xl p-8 min-h-[520px] transition-all duration-300 ease-in-out overflow-y-auto ${
                viewMode === 'Desktop' ? 'w-full max-w-3xl' : viewMode === 'Tablet' ? 'w-[520px]' : 'w-[340px]'
            } ${currentTheme.bodyBg}` } >

        { /* Embedded Navbar Inside Canvas */ } <
        div className = { `border-b pb-3 mb-6 flex justify-between items-center text-[11px] font-medium select-none ${currentTheme.border}` } >
        <
        span className = { `font-bold tracking-wide ${currentTheme.accentText}` } > ✨AuraBuild Active Render < /span> <
        div className = "flex gap-4 opacity-80" >
        <
        span className = { portfolioTheme === 'minimal_clean' ? 'text-slate-900' : 'text-white' } > About < /span> <
        span className = { portfolioTheme === 'minimal_clean' ? 'text-slate-900' : 'text-white' } > Projects < /span> < /
        div > <
        /div>

        { /* 3. Render Stack Container */ } <
        div className = "space-y-4" > {
            sections && sections.length > 0 ? (
                sections.map((section) => ( <
                    div key = { section.id }
                    onClick = {
                        (e) => {
                            e.stopPropagation();
                            setActiveSectionId(section.id);
                        }
                    }
                    className = { `relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                                    section.id === activeSectionId ? 'border-purple-500 bg-purple-500/5' : 'border-transparent'
                                }` } >
                    <
                    RenderPageContent section = { section }
                    portfolioTheme = { portfolioTheme }
                    /> < /
                    div >
                ))
            ) : ( <
                div className = "text-center py-24 text-xs text-slate-500 italic" > No canvas layouts found. < /div>
            )
        } <
        /div> < /
        div > <
        /div>
    );
}
