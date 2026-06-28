import React from 'react';

export default function PipelineBar() {
    return ( <
        div className = "h-10 bg-[#161922] border-b border-[#1f222c] flex items-center px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 gap-3 shrink-0 select-none" >
        <
        span > [Prompt] < /span> <span>→</span >
        <
        span > [Generate] < /span> <span>→</span >
        <
        span className = "text-blue-400 font-extrabold" > [Section Edit(Active)] < /span> <span>→</span >
        <
        span className = "bg-[#1e2330] text-purple-400 px-2.5 py-0.5 rounded border border-purple-500/20 font-black shadow-sm" > [Live Preview] < /span> <span>→</span >
        <
        span > [Publish Website] < /span> < /
        div >
    );
}
