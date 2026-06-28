/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                aura: {
                    darkBg: '#0d0e12',
                    panelBg: '#13151c',
                    cardBg: '#181a24',
                    borderClr: '#1f222c',
                    purple: '#a855f7',
                    blue: '#2563eb'
                }
            }
        },
    },
    plugins: [],
}
