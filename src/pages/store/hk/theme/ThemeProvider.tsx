import { useEffect } from 'react';

const THEMES: Record<string, Record<string, string | number>> = {
  quickcart: { bg:'#0E1116', surface:'#171C24', surfaceRaised:'#1F2630', text:'#F2F5F9', textMuted:'#8A94A6', border:'#262E3A', accent:'#16C77F', accentText:'#04140C', danger:'#F2545B', success:'#16C77F', radiusCard:'14px', radiusControl:'10px', fontDisplay:"'Manrope',system-ui,sans-serif", fontBody:"'Manrope',system-ui,sans-serif", gridMobile:3, gridDesktop:6, font:'Manrope:wght@500;700;800' },
  freshmart: { bg:'#FFF9F3', surface:'#FFFFFF', surfaceRaised:'#FFF2E6', text:'#2B1D12', textMuted:'#8A7461', border:'#F0E1D2', accent:'#F0761E', accentText:'#FFFFFF', danger:'#D2453C', success:'#2E9E63', radiusCard:'18px', radiusControl:'999px', fontDisplay:"'Nunito',system-ui,sans-serif", fontBody:"'Nunito',system-ui,sans-serif", gridMobile:2, gridDesktop:5, font:'Nunito:wght@600;700;900' },
  stylehub:  { bg:'#FBFAFC', surface:'#FFFFFF', surfaceRaised:'#F3F0F6', text:'#1C1922', textMuted:'#736E80', border:'#E7E3EC', accent:'#6D5E86', accentText:'#FFFFFF', danger:'#C2374A', success:'#3F8F6B', radiusCard:'4px', radiusControl:'4px', fontDisplay:"'Fraunces',Georgia,serif", fontBody:"'Inter',system-ui,sans-serif", gridMobile:2, gridDesktop:4, font:'Fraunces:opsz,wght@9..144,400;9..144,600' },
  localpro:  { bg:'#F4F6FA', surface:'#FFFFFF', surfaceRaised:'#EAEFF7', text:'#111A2B', textMuted:'#5B6779', border:'#D7DFEC', accent:'#1B4F8F', accentText:'#FFFFFF', danger:'#B3261E', success:'#1E7A4C', radiusCard:'8px', radiusControl:'6px', fontDisplay:"'IBM Plex Sans',system-ui,sans-serif", fontBody:"'IBM Plex Sans',system-ui,sans-serif", gridMobile:2, gridDesktop:4, font:'IBM+Plex+Sans:wght@400;500;600;700' },
};

export function ThemeProvider({ themeKey, primaryColor }: { themeKey: string; primaryColor?: string }) {
  useEffect(() => {
    const k = themeKey?.toLowerCase() || 'quickcart';
    const t = THEMES[k] || THEMES.quickcart;
    const accent = primaryColor || String(t.accent);

    const vars: Record<string, string> = {
      '--vs-bg': String(t.bg), '--vs-surface': String(t.surface), '--vs-surface-raised': String(t.surfaceRaised),
      '--vs-text': String(t.text), '--vs-text-muted': String(t.textMuted), '--vs-border': String(t.border),
      '--vs-accent': accent, '--vs-accent-text': String(t.accentText),
      '--vs-danger': String(t.danger), '--vs-success': String(t.success),
      '--vs-radius-card': String(t.radiusCard), '--vs-radius-control': String(t.radiusControl),
      '--vs-font-display': String(t.fontDisplay), '--vs-font-body': String(t.fontBody),
      '--vs-grid-mobile': String(t.gridMobile), '--vs-grid-desktop': String(t.gridDesktop),
    };
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

    // Load Google Font
    if (t.font) {
      const id = 'qs-hk-font';
      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
      link.href = `https://fonts.googleapis.com/css2?family=${t.font}&display=swap`;
    }

    return () => { Object.keys(vars).forEach(k => document.documentElement.style.removeProperty(k)); };
  }, [themeKey, primaryColor]);

  return null;
}
