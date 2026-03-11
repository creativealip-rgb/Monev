"use client";

import { Check, User as UserIcon, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface AccountModalProps {
    user: any;
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export function AccountModal({ user, formData, setFormData, onSave }: AccountModalProps) {
    return (
        <div className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        {formData.image ? (
                            typeof formData.image === 'string' ? (
                                <img src={formData.image} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <img src={URL.createObjectURL(formData.image)} alt="Preview" className="w-full h-full object-cover" />
                            )
                        ) : (
                            <UserIcon size={40} className="text-slate-400" />
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={24} className="text-white" />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setFormData((prev: any) => ({ ...prev, image: file }));
                                }
                            }}
                        />
                    </label>
                </div>
                <p className="text-xs text-slate-500">Klik foto untuk mengganti</p>
            </div>

            {/* Name Fields */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Depan</label>
                    <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        placeholder="Nama depan Anda"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Belakang</label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        placeholder="Nama belakang Anda"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-slate-400">@</span>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            placeholder="username"
                        />
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{user?.email || "-"}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Paket</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{user?.tier || "starter"}</p>
                </div>
            </div>

            {/* Save Button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <Check size={18} />
                Simpan Perubahan
            </motion.button>
        </div>
    );
}
