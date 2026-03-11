// Universal animation and transition utilities for SafeRide Dashboard
// Used across both Admin and User interfaces for consistency

export const transitions = {
  // Standard transitions
  default: 'transition-all duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
  
  // Specific property transitions
  colors: 'transition-colors duration-200',
  opacity: 'transition-opacity duration-200',
  transform: 'transition-transform duration-200',
  shadow: 'transition-shadow duration-200',
  
  // Combined transitions
  button: 'transition-all duration-200 active:scale-[0.98]',
  card: 'transition-all duration-300 hover:shadow-lg',
  input: 'transition-all duration-200 focus:ring-2',
};

export const hoverEffects = {
  // Button hover effects
  buttonPrimary: 'hover:bg-blue-700 hover:shadow-md',
  buttonSecondary: 'hover:bg-slate-700 hover:shadow-md',
  buttonSuccess: 'hover:bg-green-700 hover:shadow-md',
  buttonDanger: 'hover:bg-red-700 hover:shadow-md',
  buttonWarning: 'hover:bg-yellow-700 hover:shadow-md',
  buttonGhost: 'hover:bg-slate-800/50',
  
  // Card hover effects
  card: 'hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-950/50',
  cardSubtle: 'hover:bg-slate-800/30',
  
  // Link hover effects
  link: 'hover:text-blue-400 hover:underline',
  linkDanger: 'hover:text-red-400',
  linkSuccess: 'hover:text-green-400',
  
  // Interactive elements
  scale: 'hover:scale-[1.02]',
  scaleSmall: 'hover:scale-[1.01]',
  lift: 'hover:-translate-y-1',
  
  // Border effects
  borderGlow: 'hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20',
};

export const focusEffects = {
  default: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
  input: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  danger: 'focus:outline-none focus:ring-2 focus:ring-red-500',
  success: 'focus:outline-none focus:ring-2 focus:ring-green-500',
};

export const activeEffects = {
  scale: 'active:scale-[0.98]',
  scaleSmall: 'active:scale-[0.99]',
  brightness: 'active:brightness-90',
};

export const animations = {
  // Fade animations
  fadeIn: 'animate-in fade-in-0 duration-200',
  fadeOut: 'animate-out fade-out-0 duration-200',
  
  // Slide animations
  slideInFromTop: 'animate-in slide-in-from-top-4 duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-4 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-4 duration-300',
  
  // Zoom animations
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',
  
  // Combined animations
  fadeInZoom: 'animate-in fade-in-0 zoom-in-95 duration-200',
  fadeOutZoom: 'animate-out fade-out-0 zoom-out-95 duration-200',
  
  // Pulse and bounce
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
};

// Badge color schemes (universal across user and admin)
export const badgeStyles = {
  // Status badges
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  
  // Violation type badges
  helmet: 'bg-red-500/10 text-red-400 border-red-500/20',
  plate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overloading: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  
  // Payment status badges
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// Shared component class combinations
export const componentStyles = {
  // Input fields
  input: `
    w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200
    ${focusEffects.input}
    ${transitions.default}
  `.trim().replace(/\s+/g, ' '),
  
  // Buttons
  buttonPrimary: `
    px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
    ${hoverEffects.buttonPrimary}
    ${activeEffects.scale}
    ${transitions.button}
  `.trim().replace(/\s+/g, ' '),
  
  buttonSecondary: `
    px-4 py-2 bg-slate-700 text-white rounded-lg font-medium
    ${hoverEffects.buttonSecondary}
    ${activeEffects.scale}
    ${transitions.button}
  `.trim().replace(/\s+/g, ' '),
  
  buttonSuccess: `
    px-4 py-2 bg-green-600 text-white rounded-lg font-medium
    ${hoverEffects.buttonSuccess}
    ${activeEffects.scale}
    ${transitions.button}
  `.trim().replace(/\s+/g, ' '),
  
  buttonDanger: `
    px-4 py-2 bg-red-600 text-white rounded-lg font-medium
    ${hoverEffects.buttonDanger}
    ${activeEffects.scale}
    ${transitions.button}
  `.trim().replace(/\s+/g, ' '),
  
  buttonGhost: `
    px-4 py-2 text-slate-200 rounded-lg font-medium
    ${hoverEffects.buttonGhost}
    ${activeEffects.scale}
    ${transitions.button}
  `.trim().replace(/\s+/g, ' '),
  
  // Cards
  card: `
    bg-slate-900 rounded-xl border border-slate-800
    ${transitions.card}
  `.trim().replace(/\s+/g, ' '),
  
  cardInteractive: `
    bg-slate-900 rounded-xl border border-slate-800
    ${hoverEffects.card}
    ${transitions.card}
    cursor-pointer
  `.trim().replace(/\s+/g, ' '),
  
  // Dialogs/Modals
  dialogOverlay: `
    fixed inset-0 bg-black/50 flex items-center justify-center z-50
    ${animations.fadeIn}
  `.trim().replace(/\s+/g, ' '),
  
  dialogContent: `
    bg-slate-900 rounded-xl border border-slate-800 p-6
    ${animations.fadeInZoom}
  `.trim().replace(/\s+/g, ' '),
  
  // Tables
  tableRow: `
    ${hoverEffects.cardSubtle}
    ${transitions.default}
  `.trim().replace(/\s+/g, ' '),
};

// Helper function to combine classes
export const cx = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};
