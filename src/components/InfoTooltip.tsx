import { Info } from 'lucide-react';

export function InfoTooltip({ content }: { content: React.ReactNode }) {
  return (
    <div className="relative group flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
      <Info className="w-4 h-4 text-text-muted group-hover:text-accent-cyan transition-colors" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-bg-dark border border-border-color rounded-lg shadow-2xl text-xs text-text-primary opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="relative z-10 leading-relaxed font-normal">{content}</div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-bg-dark border-b border-r border-border-color transform rotate-45 -mt-1.5"></div>
      </div>
    </div>
  );
}
