"use client";

import { cn } from "@/frontend/lib/utils";

interface ProgressDotsProps {
    total: number;
    current: number;
    onDotClick?: (index: number) => void;
}

export function ProgressDots({ total, current, onDotClick }: ProgressDotsProps) {
    return (
        <div className="flex items-center justify-center gap-2">
            {Array.from({ length: total }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onDotClick?.(index)}
                    className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === current
                            ? "w-6 bg-sky-500"
                            : "w-2 bg-slate-300 hover:bg-slate-400"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === current ? "true" : "false"}
                />
            ))}
        </div>
    );
}
