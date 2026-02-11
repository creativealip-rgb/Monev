import { cn } from "@/lib/utils";

interface FeatureItemProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

export function FeatureItem({ label, icon, onClick }: FeatureItemProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-3 group transition-all"
        >
            <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 flex items-center justify-center transition-all group-hover:border-blue-200 group-hover:bg-blue-50/50 group-active:scale-95">
                {icon}
            </div>
            <span className="text-[11px] font-medium text-slate-600 text-center leading-tight max-w-[80px] group-hover:text-slate-900 transition-colors">
                {label}
            </span>
        </button>
    );
}
