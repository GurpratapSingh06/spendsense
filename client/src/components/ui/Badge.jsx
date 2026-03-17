import { CATEGORY_MAP } from '../../constants/categories';

export default function Badge({ category, size = 'md' }) {
  const cat = CATEGORY_MAP[category];
  if (!cat) return <span className="text-xs text-gray-500">{category}</span>;

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const Icon = cat.icon;

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center gap-1 rounded-full font-bold uppercase tracking-wider ${sizes[size]} w-[130px] max-w-[130px] flex-nowrap`}
      style={{ backgroundColor: cat.bg, color: cat.color }}
    >
      <Icon size={12} strokeWidth={1.5} className="flex-shrink-0" />
      <span className="truncate">{cat.key}</span>
    </span>
  );
}
