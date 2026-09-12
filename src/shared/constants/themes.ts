export const THEMES = {
  QUICKCART: {
    key: 'QUICKCART',
    label: 'QuickCart',
    description: 'Blinkit/Zepto style — dark background with green CTAs',
    bestFor: 'Grocery, Kirana, FMCG',
    colors: {
      primary: '#16a34a',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      text: '#ffffff',
    },
  },
  FRESHMART: {
    key: 'FRESHMART',
    label: 'FreshMart',
    description: 'Instamart/Swiggy style — warm orange, fresh feel',
    bestFor: 'Food, Dairy, Fresh produce',
    colors: {
      primary: '#f97316',
      background: '#fff8f0',
      surface: '#ffffff',
      text: '#1a1a1a',
    },
  },
  STYLEHUB: {
    key: 'STYLEHUB',
    label: 'StyleHub',
    description: 'Minimal white with purple accents — premium feel',
    bestFor: 'Fashion, Boutique, Accessories',
    colors: {
      primary: '#7c3aed',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#1a1a1a',
    },
  },
  LOCALPRO: {
    key: 'LOCALPRO',
    label: 'LocalPro',
    description: 'Professional blue — structured and trustworthy',
    bestFor: 'Electronics, Tools, Hardware',
    colors: {
      primary: '#1d4ed8',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
    },
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
