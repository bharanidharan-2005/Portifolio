// src/canvas/themes.js

export const PORTFOLIO_THEMES = {
    dark_developer: {
        id: "dark_developer",
        name: "1. Dark Developer Theme",
        bodyBg: "bg-[#0f172a]", // Slate 900
        cardBg: "bg-[#1e293b] border-slate-700/50 hover:border-slate-500 text-slate-100",
        textPrimary: "text-white font-mono",
        textSecondary: "text-slate-400 font-mono",
        accentText: "text-emerald-400 font-mono",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono",
        border: "border-slate-700"
    },
    glassmorphism: {
        id: "glassmorphism",
        name: "2. Modern Glassmorphism Theme",
        bodyBg: "bg-gradient-to-br from-[#1a1c29] via-[#2d1b4e] to-[#1a1c29]",
        cardBg: "bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        textPrimary: "text-white tracking-wide",
        textSecondary: "text-slate-300",
        accentText: "text-pink-400 font-medium",
        badge: "bg-white/10 text-pink-300 border-white/10",
        border: "border-white/10"
    },
    gradient: {
        id: "gradient",
        name: "3. Creative Gradient Theme",
        bodyBg: "bg-[#0b0c10]",
        cardBg: "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/20 hover:border-purple-500/50 text-white",
        textPrimary: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-extrabold",
        textSecondary: "text-purple-200/70",
        accentText: "text-pink-400",
        badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        border: "border-purple-900/60"
    },
    minimal_clean: {
        id: "minimal_clean",
        name: "4. Minimal Clean Theme",
        bodyBg: "bg-white",
        cardBg: "bg-[#f8fafc] border-slate-200 hover:border-slate-900 text-slate-900 shadow-sm",
        textPrimary: "text-slate-950 font-light tracking-tight",
        textSecondary: "text-slate-500 tracking-normal",
        accentText: "text-slate-900 font-bold tracking-widest uppercase",
        badge: "bg-slate-100 text-slate-800 border-slate-200",
        border: "border-slate-200"
    },
    cyberpunk_neon: {
        id: "cyberpunk_neon",
        name: "5. Cyberpunk / Neon Theme",
        bodyBg: "bg-[#050505]",
        cardBg: "bg-[#0d0d0d] border-[#00f0ff]/20 hover:border-[#f000ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.05)] hover:shadow-[0_0_15px_rgba(240,0,255,0.2)]",
        textPrimary: "text-white font-black tracking-tighter uppercase shadow-neon",
        textSecondary: "text-[#cbd5e1]",
        accentText: "text-[#f000ff] tracking-widest font-black",
        badge: "bg-[#f000ff]/10 text-[#f000ff] border-[#f000ff]/30",
        border: "border-[#00f0ff]/30"
    }
};
