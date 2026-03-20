// src/lib/theme.ts
// Runs before CSS loads to prevent flash of wrong theme.
// Injected as a raw <script> in __root.tsx <head>.
export const themeInitScript = `(function(){var t=localStorage.getItem('theme')||'dark';var r=document.documentElement;r.classList.remove('professional-dark','professional-light','high-contrast','retro-tech','minimalist','custom-theme','light');if(t==='dark')r.classList.add('professional-dark');else if(t==='light')r.classList.add('professional-light');else if(t==='high-contrast')r.classList.add('high-contrast');else r.classList.add('professional-dark');})();`
