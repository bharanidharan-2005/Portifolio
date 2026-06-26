import React from 'react';

export default function HeroBlock({ data }) {
  return (
    <div className="py-10 px-4 text-center space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
        {data.heading || "Alex Chen — Software Developer"}
      </h1>
      <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
        {data.subheading || "Development AI-generated developer Portfolio presentation preview layer."}
      </p>
      <div className="flex justify-center gap-2.5 pt-2 select-none">
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] px-4 py-2 rounded-xl transition-colors shadow-lg shadow-purple-600/10">
          See Live
        </button>
        <button className="border border-slate-800 text-slate-300 font-semibold text-[11px] px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors">
          Design
        </button>
      </div>
    </div>
  );
}
