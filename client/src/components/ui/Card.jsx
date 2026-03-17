export default function Card({ children, className = '', hover = false, danger = false, ...props }) {
  return (
    <div
      className={`card ${hover ? 'cursor-pointer' : ''} ${danger ? 'border-2 border-danger animate-shake' : 'border border-transparent'} relative ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
