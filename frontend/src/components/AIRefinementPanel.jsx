import React from 'react';
import { PORTFOLIO_THEMES } from '../canvas/themes';

export default function AIRefinementPanel({
    logs,
    onSubmitPrompt,
    selectedSection,
    onManualUpdate,
    activeTool,
    pages,
    userData,
    setUserData
}) {
    const [promptText, setPromptText] = React.useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!promptText.trim()) return;
        onSubmitPrompt(promptText);
        setPromptText("");
    };

    // 🎨 RENDER CONDITION: If user clicked "Brand Themes" on the left sidebar tool belt
    if (activeTool === 'Brand Themes') {
        return ( <
            div className = "w-80 h-full bg-[#13151c] border-l border-[#1f222c] p-6 flex flex-col justify-start select-none shrink-0 overflow-y-auto" >
            <
            div className = "mb-6" >
            <
            h3 className = "text-xs uppercase font-black tracking-wider text-purple-400" > Workspace Themes < /h3> <
            p className = "text-[10px] text-slate-500 mt-1" > Select an identity framework to style your live portfolio build canvas cards. < /p> < /
            div >

            <
            div className = "space-y-3" > {
                Object.values(PORTFOLIO_THEMES || {}).map((themeObj) => {
                    // Check if this specific theme is the currently active selected option (Safe && Evaluation)
                    const isSelected = userData && userData.theme === themeObj.id;

                    return ( <
                        button key = { themeObj.id }
                        type = "button"
                        onClick = {
                            () => setUserData({...userData, theme: themeObj.id })
                        }
                        className = { `w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-200 ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/5'
                                        : 'border-[#232635] bg-[#0d0e12] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }` } >
                        <
                        span > { themeObj.name } < /span>

                        { /* Structural status dot ring indicators */ } <
                        div className = "flex gap-1 items-center" >
                        <
                        span className = { `w-2 h-2 rounded-full ${
                                        themeObj.id === 'minimal_clean' ? 'bg-slate-400' : 'bg-purple-500'
                                    }` } > < /span> <
                        span className = { `w-2 h-2 rounded-full ${
                                        themeObj.id === 'cyberpunk_neon' ? 'bg-[#00f0ff]' : 'bg-indigo-500'
                                    }` } > < /span> < /
                        div > <
                        /button>
                    );
                })
            } <
            /div> < /
            div >
        );
    }

    // 🤖 DEFAULT RENDER: Standard AI Element Prompt Inspector Tool Layout (e.g., Content Generator)
    return ( <
            div className = "w-80 h-full bg-[#13151c] border-l border-[#1f222c] flex flex-col select-none shrink-0 overflow-hidden" > { /* Upper Context Property Card Manual Input Block */ } <
            div className = "p-6 border-b border-[#1f222c] space-y-4 shrink-0" >
            <
            h3 className = "text-xs uppercase font-black tracking-wider text-purple-400" > ⚡Section Inspector < /h3> {
            selectedSection ? ( <
                div className = "space-y-3" >
                <
                label className = "block text-[10px] uppercase font-bold tracking-wider text-slate-500" >
                Editing Target: [{ selectedSection.section_type.toUpperCase() }] <
                /label> <
                input type = "text"
                className = "w-full bg-[#0d0e12] border border-[#232635] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                value = {
                    (selectedSection.content_data && selectedSection.content_data.heading) ||
                    (selectedSection.content_data && selectedSection.content_data.title) ||
                    ""
                }
                onChange = {
                    (e) => {
                        const hasHeading = selectedSection.content_data && selectedSection.content_data.heading;
                        const key = hasHeading ? 'heading' : 'title';
                        onManualUpdate(selectedSection.id, {...selectedSection.content_data, [key]: e.target.value });
                    }
                }
                /> < /
                div >
            ) : ( <
                p className = "text-[11px] text-slate-500 italic" > Select an active canvas element row chunk to access component parameters. < /p>
            )
        } <
        /div>

    { /* Downward Log History Tracker Output Feed */ } <
    div className = "flex-1 p-6 overflow-y-auto space-y-4" >
        <
        h4 className = "text-[10px] uppercase font-bold tracking-wider text-slate-500" > AI Generation Log < /h4> <
    div className = "space-y-2" > {
            logs && logs.length > 0 ? logs.map((log, i) => ( <
                div key = { i }
                className = "bg-[#0d0e12] border border-[#232635] p-3 rounded-lg text-[11px] font-mono text-slate-400 leading-relaxed" > { log } <
                /div>
            )) : ( <
                p className = "text-[11px] text-slate-600 italic" > No mutations applied in this stream. < /p>
            )
        } <
        /div> < /
    div >

        { /* Bottom Form Text Submission Block */ } <
        form onSubmit = { handleSubmit }
    className = "p-4 border-t border-[#1f222c] bg-[#0d0e12]/50 shrink-0" >
        <
        div className = "relative flex items-center" >
        <
        input type = "text"
    placeholder = "Ask AI to rewrite this block..."
    className = "w-full bg-[#0d0e12] border border-[#232635] rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none focus:border-purple-500 font-medium"
    value = { promptText }
    onChange = {
        (e) => setPromptText(e.target.value)
    }
    /> <
    button type = "submit"
    className = "absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs" > ⚡ < /button> < /
    div > <
        /form> < /
    div >
);
}
placeholder = "Ask AI to rewrite this block..."
className = "w-full bg-[#0d0e12] border border-[#232635] rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none focus:border-purple-500 font-medium"
value = { promptText }
onChange = {
    (e) => setPromptText(e.target.value)
}
/> <
button type = "submit"
className = "absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs" > ⚡ < /button> < /
div > <
    /form> < /div >
);
}
className = "p-4 border-t border-[#1f222c] bg-[#0d0e12]/50 shrink-0" >
    <
    div className = "relative flex items-center" >
    <
    input type = "text"
placeholder = "Ask AI to rewrite this block..."
className = "w-full bg-[#0d0e12] border border-[#232635] rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none focus:border-purple-500 font-medium"
value = { promptText }
onChange = {
    (e) => setPromptText(e.target.value)
}
/> <
button type = "submit"
className = "absolute right-3 text-purple-400 hover:text-purple-300 font-bold text-xs" > ⚡ < /button> < /
div > <
    /form> < /
div >
);
}
div > <
    /form> < /
div >
);
}
/form> < /
div >
);
};
}
iv >
);
};
};
}
