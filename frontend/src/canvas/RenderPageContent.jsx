import React from 'react';

export default function RenderPageContent({ section, portfolioTheme }) {
    if (!section) return null;

    const currentType = (section.section_type || '').toLowerCase().trim();
    const data = section.content_data || {};

    const isMinimal = portfolioTheme === 'minimal_clean';
    const primaryText = isMinimal ? 'text-slate-900' : 'text-white';
    const secondaryText = isMinimal ? 'text-slate-600' : 'text-slate-400';
    const cardBg = isMinimal ? 'bg-slate-50 border border-slate-200' : 'bg-[#0d0e12] border border-[#1f222c]';

    return (
        <div className="w-full">
            {/* --------------------------------------------------------- */}
            {/* 1. HERO SECTION RENDERER                                  */}
            {/* --------------------------------------------------------- */}
            {currentType === 'hero' && (
                <div className="text-center py-8 space-y-4">
                    <h1 className={`text-3xl font-black tracking-tight uppercase ${primaryText}`}>
                        {data.heading || "Your Name"}
                    </h1>
                    <p className={`text-sm max-w-md mx-auto leading-relaxed ${secondaryText}`}>
                        {data.subheading || "Professional Headline"}
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                if (data.liveUrl) {
                                    const targetUrl = data.liveUrl.startsWith('http') ? data.liveUrl : `https://${data.liveUrl}`;
                                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                } else {
                                    alert("No destination link specified inside the configuration editor bar.");
                                }
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer select-none border-none outline-none"
                        >
                            See Live
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (data.designUrl) {
                                    const targetUrl = data.designUrl.startsWith('http') ? data.designUrl : `https://${data.designUrl}`;
                                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                } else {
                                    alert("No design repository url provided.");
                                }
                            }}
                            className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all cursor-pointer select-none outline-none ${
                                isMinimal 
                                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white' 
                                    : 'border-[#232635] text-slate-300 hover:bg-slate-900 bg-transparent'
                            }`}
                        >
                            Design
                        </button>
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 2. ABOUT ME NARRATIVE BLOCK                               */}
            {/* --------------------------------------------------------- */}
            {currentType === 'about' && (
                <div className="space-y-2 py-4">
                    <h2 className="text-[10px] uppercase font-black tracking-widest text-purple-400">About Me</h2>
                    <p className={`text-xs leading-relaxed font-medium ${secondaryText}`}>
                        {data.bio || "Provide a professional summary text context profile."}
                    </p>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 3. EDUCATIONAL BACKGROUND GRID                             */}
            {/* --------------------------------------------------------- */}
            {currentType === 'education' && (
                <div className="space-y-3 py-4">
                    <h2 className="text-[10px] uppercase font-black tracking-widest text-purple-400">Educational Background</h2>
                    <div className="space-y-3">
                        {(data.schools || []).map((school, i) => (
                            <div key={i} className={`p-4 rounded-xl transition-all ${cardBg}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <h3 className={`text-xs font-bold uppercase tracking-wide ${primaryText}`}>
                                            {school.institution || "College or Institution"}
                                        </h3>
                                        <p className="text-[11px] font-medium text-purple-400/90">
                                            {school.degree || "Course Certificate Program Major"}
                                        </p>
                                    </div>
                                    {school.years && (
                                        <span className="text-[9px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md shrink-0 whitespace-nowrap">
                                            {school.years}
                                        </span>
                                    )}
                                </div>
                                {school.score && (
                                    <div className="mt-3 pt-2 border-t border-slate-800/20 flex items-center gap-1.5 text-[10px]">
                                        <span className={secondaryText}>Performance Metric:</span>
                                        <span className={`font-mono font-bold ${primaryText}`}>{school.score}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 4. CORE EXPERTISE METRICS (SKILLS)                         */}
            {/* --------------------------------------------------------- */}
            {currentType === 'skills' && (
                <div className="space-y-3 py-4">
                    <h2 className="text-[10px] uppercase font-black tracking-widest text-purple-400">Core Expertise Metrics</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                        {(data.items || []).map((skill, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className={primaryText}>{skill.name || "Technology Key"}</span>
                                    <span className="text-purple-400 font-mono">{skill.level || 50}%</span>
                                </div>
                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isMinimal ? 'bg-slate-200' : 'bg-slate-900'}`}>
                                    <div 
                                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${skill.level || 50}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 5. SHOWCASE OF INNOVATIONS (PROJECTS)                     */}
            {/* --------------------------------------------------------- */}
            {currentType === 'projects_grid' && (
                <div className="space-y-4 py-4">
                    <h2 className="text-[10px] uppercase font-black tracking-widest text-purple-400">
                        {data.title || "Showcase of Innovations"}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {(data.projects || []).map((project, i) => (
                            <div 
                                key={i} 
                                onClick={(e) => {
                                    if (project.projectUrl) {
                                        e.stopPropagation();
                                        const targetUrl = project.projectUrl.startsWith('http') ? project.projectUrl : `https://${project.projectUrl}`;
                                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                                className={`p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-md transition-all ${cardBg} ${
                                    project.projectUrl ? 'cursor-pointer hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/[0.02]' : ''
                                }`}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center gap-2">
                                        <h3 className={`text-xs font-bold uppercase tracking-wide truncate ${primaryText}`}>
                                            {project.title || "Project Name"}
                                        </h3>
                                        {project.projectUrl && (
                                            <span className="text-[9px] text-purple-400 font-bold shrink-0">🔗 Live</span>
                                        )}
                                    </div>
                                    <p className={`text-[11px] leading-relaxed line-clamp-3 font-medium ${secondaryText}`}>
                                        {project.desc || "Operational item details summary context."}
                                    </p>
                                </div>
                                {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {project.tags.map((tag, j) => (
                                            <span key={j} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/60 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* 6. CONTACT CALL TO ACTION CHANNEL                         */}
            {/* --------------------------------------------------------- */}
            {currentType === 'contact' && (
                <div className="text-center py-6 border-t border-slate-800/10 mt-4 space-y-3">
                    <h2 className="text-[10px] uppercase font-black tracking-widest text-purple-400">Get In Touch</h2>
                    <p className={`text-xs max-w-sm mx-auto leading-normal font-medium ${secondaryText}`}>
                        {data.text || "Let's collaborate on production platforms. Reach out directly below."}
                    </p>
                </div>
            )}
        </div>
    );
}
