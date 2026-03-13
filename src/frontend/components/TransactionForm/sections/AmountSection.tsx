"use client";

import { formatCurrency } from "@/frontend/lib/utils";
import type { QuickTemplate } from "../types";

interface AmountSectionProps {
    amount: string;
    description: string;
    quickTemplates: QuickTemplate[];
    onAmountChange: (amount: string) => void;
    onDescriptionChange: (description: string) => void;
    onManageTemplates: () => void;
    onUseTemplate: (template: QuickTemplate) => void;
}

export function AmountSection({
    amount,
    description,
    quickTemplates,
    onAmountChange,
    onDescriptionChange,
    onManageTemplates,
    onUseTemplate,
}: AmountSectionProps) {
    return (
        <div className="space-y-6">
            {/* Quick Templates */}
            {quickTemplates.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Template Cepat</p>
                        <button
                            onClick={onManageTemplates}
                            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700"
                        >
                            + Kelola Template
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {quickTemplates.slice(0, 4).map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onUseTemplate(template)}
                                className="flex flex-col items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-sky-50 dark:hover:bg-sky-900/30 border border-transparent hover:border-sky-200 dark:hover:border-sky-800 transition-all group"
                            >
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">{template.label}</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-500">{formatCurrency(template.amount)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Amount Input */}
            <div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Nominal</p>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">Rp</div>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        autoFocus
                    />
                </div>
            </div>

            {/* Description Input */}
            <div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Deskripsi (Opsional)</p>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Contoh: Makan siang di warteg (boleh kosong)"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
            </div>
        </div>
    );
}
