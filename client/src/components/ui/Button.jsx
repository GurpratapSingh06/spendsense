export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  const base = 'font-display font-semibold rounded-[10px] transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
  const variants = {
    primary: 'bg-accent text-white hover:bg-[#EA6C0A] hover:shadow-card-hover',
    secondary: 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
    ghost: 'bg-transparent text-[#374151] border border-divider hover:bg-[#F3F4F6]',
    glow: 'bg-accent text-white animate-pulse-glow hover:bg-[#EA6C0A]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
