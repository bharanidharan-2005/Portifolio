import React from 'react';
import { PORTFOLIO_THEMES } from './themes';

export default function RenderPageContent({ section, portfolioTheme }) {
    const style = PORTFOLIO_THEMES[portfolioTheme] || PORTFOLIO_THEMES.cyberpunk_neon;
    const data = section.content_data || {};

    if (section.section_type === 'hero') {
        return ( <
            div className = "text-center py-10 space-y-4" >
            <
            h1 className = { `text-4xl font-black tracking-tight ${style.textPrimary}` } > { data.heading || "Visual Stories: My Portfolio" } <
            /h1> <
            p className = { `text-sm max-w-xl mx-auto ${style.textSecondary}` } > { data.subheading || "A curated collection of my latest creative work brought to life." } <
            /p> <
            div className = "flex justify-center gap-3 mt-4" >
            <
            button className = "bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md" >
            See Live <
            /button> <
            button className = { `text-xs font-bold px-5 py-2.5 rounded-xl border ${portfolioTheme === 'minimal_clean' ? 'border-slate-300 text-slate-800' : 'border-white/20 text-white'}` } >
            Design <
            /button> < /
            div > <
            /div>
        );
    }

    if (section.section_type === 'projects_grid') {
        return ( <
            div className = "space-y-4" >
            <
            h2 className = { `text-xs uppercase tracking-widest font-bold ${style.accentText}` } > { data.title || "Featured Projects" } <
            /h2> <
            div className = "grid grid-cols-1 md:grid-cols-2 gap-4" > {
                (data.projects || [
                    { title: "Urban Echoes", desc: "A photographic journey through cityscapes capturing modern architecture.", tags: ["Design", "Photo"] },
                    { title: "Nature's Palette", desc: "An exploration of serene landscapes showcasing raw natural beauty.", tags: ["Art", "Creative"] }
                ]).map((project, idx) => ( <
                    div key = { idx }
                    className = { `p-5 border rounded-xl transition-all ${style.cardBg}` } >
                    <
                    h3 className = { `text-sm font-bold mb-1.5 ${portfolioTheme === 'minimal_clean' ? 'text-slate-900' : 'text-white'}` } > { project.title } < /h3> <
                    p className = { `text-xs mb-4 leading-relaxed ${style.textSecondary}` } > { project.desc } < /p> <
                    div className = "flex flex-wrap gap-1.5" > {
                        (project.tags || []).map((tag, tIdx) => ( <
                            span key = { tIdx }
                            className = { `text-[9px] font-bold px-2 py-0.5 border rounded-md ${style.badge}` } > { tag } <
                            /span>
                        ))
                    } <
                    /div> < /
                    div >
                ))
            } <
            /div> < /
            div >
        );
    }

    return null;
}
