import React from 'react';

export default function RenderPageContent({ section, portfolioTheme }) {
    if (!section) return null;

    const data = section.content_data || {};
    
    // Force lower casing to match comparison keys flawlessly
    const currentType = (section.section_type || '').toLowerCase().trim();

    return (
        <div className="w-full">
            {/* --------------------------------------------------------- */}
            {/* 1. HERO SECTION RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'hero' && (
                <div className="text-center py-8 space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                        {data.heading || "Your Name"}
                    </h1>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                        {data.subheading || "Professional Headline"}
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md">See Live</button>
                        <button className="px-4 py-2 border border-[#232635] text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-900 transition-all">Design</button>
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 2. ABOUT SECTION RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'about' && (
                <div className="space-y-2">
                    <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase">About Me</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {data.bio || "No biography details seeded yet."}
                    </p>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 3. EDUCATION SECTION RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'education' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase">Educational Background</h3>
                    <div className="space-y-4">
                        {(data.schools || []).map((school, index) => (
                            <div key={index} className="border-l-2 border-purple-500/30 pl-4 py-1 space-y-1 hover:border-purple-500 transition-all bg-[#13151c]/30 p-3 rounded-r-xl">
                                <div className="flex justify-between items-start gap-4">
                                    <h4 className="text-xs font-bold text-white">{school.institution}</h4>
                                    <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md shrink-0">{school.years}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 font-medium">{school.degree}</p>
                                {school.score && (
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Performance: <span className="text-slate-400 font-semibold">{school.score}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 4. SKILLS SECTION RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'skills' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase">Core Expertise Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(data.items || []).map((skill, index) => (
                            <div key={index} className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                    <span>{skill.name}</span>
                                    <span className="text-purple-400">{skill.level}%</span>
                                </div>
                                <div className="w-full bg-[#13151c] h-1.5 rounded-full overflow-hidden border border-[#1f222c]">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
                                        style={{ width: `${skill.level}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 5. PROJECTS GRID RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'projects_grid' && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase">
                        {data.title || "Featured Achievements"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(data.projects || []).map((project, idx) => (
                            <div key={idx} className="bg-[#13151c]/60 border border-[#1f222c] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-800 transition-all">
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-white">{project.title}</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{project.desc}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(project.tags || []).map((tag, tIdx) => (
                                        <span key={tIdx} className="px-2 py-0.5 bg-[#0d0e12] border border-[#232635] text-[9px] font-bold text-slate-400 rounded-md">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 6. CONTACT SECTION RENDERER */}
            {/* --------------------------------------------------------- */}
            {currentType === 'contact' && (
                <div className="text-center py-4 space-y-3">
                    <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase">Initiate Collaboration</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
                        {data.text || "Get in touch directly to discuss projects."}
                    </p>
                    <div className="pt-2">
                        <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/10">
                            Send Transmission Message
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
