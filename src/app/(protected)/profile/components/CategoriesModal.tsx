"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Hash, Sparkles, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";

interface Category {
    id: number;
    name: string;
    type: "expense" | "income";
    color: string;
    userId: number;
}

interface TransactionTemplate {
    id: string;
    name: string;
    amount: number;
    description: string;
    categoryId: number;
    type: "expense" | "income";
}

interface CustomTag {
    id: string;
    name: string;
    color: string;
}

interface CategoriesModalProps {
    categories: Category[];
    loadData: () => void;
}

export function CategoriesModal({ categories, loadData }: CategoriesModalProps) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<"categories" | "templates" | "tags">("categories");
    const [loading, setLoading] = useState(false);
    
    // Category state
    const [newCategory, setNewCategory] = useState({ 
        name: "", 
        type: "expense" as "expense" | "income", 
        icon: "Tag", 
        color: "#ec4899" 
    });
    
    // Template state
    const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
    const [newTemplate, setNewTemplate] = useState<Partial<TransactionTemplate>>({
        name: "",
        amount: 0,
        description: "",
        categoryId: undefined,
        type: "expense"
    });
    
    // Tags state
    const [tags, setTags] = useState<CustomTag[]>([]);
    const [newTag, setNewTag] = useState({ name: "", color: "#3b82f6" });
    const [showAddTag, setShowAddTag] = useState(false);

    const tagColors = [
        "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
        "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
        "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
    ];

    // Load templates and tags from localStorage
    useEffect(() => {
        const savedTemplates = localStorage.getItem("monev_templates");
        const savedTags = localStorage.getItem("monev_tags");
        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
        if (savedTags) setTags(JSON.parse(savedTags));
    }, []);

    const saveTemplates = (newTemplates: TransactionTemplate[]) => {
        setTemplates(newTemplates);
        localStorage.setItem("monev_templates", JSON.stringify(newTemplates));
    };

    const saveTags = (newTags: CustomTag[]) => {
        setTags(newTags);
        localStorage.setItem("monev_tags", JSON.stringify(newTags));
    };

    // Category handlers
    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error("Validasi", "Nama kategori wajib diisi.");
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetch("/api/categories", {
                method: "POST",
                body: JSON.stringify(newCategory)
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori berhasil ditambahkan!");
                setNewCategory({ name: "", type: "expense", icon: "Tag", color: "#ec4899" });
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menambahkan kategori.");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Yakin ingin menghapus kategori ini?")) return;

        try {
            setLoading(true);
            const response = await apiFetch(`/api/categories?id=${id}`, { method: "DELETE" });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori dihapus.");
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus kategori.");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    // Template handlers
    const handleAddTemplate = () => {
        if (!newTemplate.name || !newTemplate.categoryId) {
            toast.error("Validasi", "Nama dan kategori wajib diisi.");
            return;
        }

        const template: TransactionTemplate = {
            id: Date.now().toString(),
            name: newTemplate.name,
            amount: newTemplate.amount || 0,
            description: newTemplate.description || "",
            categoryId: newTemplate.categoryId,
            type: newTemplate.type || "expense"
        };

        saveTemplates([...templates, template]);
        setNewTemplate({ name: "", amount: 0, description: "", categoryId: undefined, type: "expense" });
        toast.success("Berhasil", "Template ditambahkan!");
    };

    const handleDeleteTemplate = (id: string) => {
        if (!confirm("Hapus template ini?")) return;
        saveTemplates(templates.filter(t => t.id !== id));
    };

    // Tag handlers
    const handleAddTag = () => {
        if (!newTag.name.trim()) {
            toast.error("Validasi", "Nama tag wajib diisi.");
            return;
        }

        const tag: CustomTag = {
            id: Date.now().toString(),
            name: newTag.name,
            color: newTag.color
        };

        saveTags([...tags, tag]);
        setNewTag({ name: "", color: "#3b82f6" });
        setShowAddTag(false);
        toast.success("Berhasil", "Tag ditambahkan!");
    };

    const handleDeleteTag = (id: string) => {
        if (!confirm("Hapus tag ini?")) return;
        saveTags(tags.filter(t => t.id !== id));
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                activeTab === id 
                    ? "bg-pink-500 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
        >
            <Icon size={14} />
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
                <TabButton id="categories" label="Kategori" icon={Tag} />
                <TabButton id="templates" label="Template" icon={Sparkles} />
                <TabButton id="tags" label="Tag" icon={Hash} />
            </div>

            <AnimatePresence mode="wait">
                {/* Categories Tab */}
                {activeTab === "categories" && (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Add Category */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Tambah Kategori</h5>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nama kategori..."
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={newCategory.type}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as "expense" | "income" }))}
                                        className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                    >
                                        <option value="expense">Pengeluaran</option>
                                        <option value="income">Pemasukan</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={newCategory.color}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-full h-full min-h-[42px] rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={loading}
                                        className="py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Tambah
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category List */}
                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-slate-500">Kategori Anda</h5>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                                                    <Tag size={14} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900 dark:text-white">{cat.name}</p>
                                                    <p className="text-[10px] text-slate-500 capitalize">{cat.type === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Templates Tab */}
                {activeTab === "templates" && (
                    <motion.div
                        key="templates"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Add Template */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Template Baru</h5>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={newTemplate.name || ""}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nama template (contoh: Gaji Bulanan)"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={newTemplate.amount || ""}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                                        placeholder="Jumlah"
                                        className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                    />
                                    <select
                                        value={newTemplate.type}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as "expense" | "income" }))}
                                        className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                    >
                                        <option value="expense">Pengeluaran</option>
                                        <option value="income">Pemasukan</option>
                                    </select>
                                </div>
                                <select
                                    value={newTemplate.categoryId || ""}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={newTemplate.description || ""}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Deskripsi (opsional)"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                />
                                <button
                                    onClick={handleAddTemplate}
                                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Save size={16} />
                                    Simpan Template
                                </button>
                            </div>
                        </div>

                        {/* Templates List */}
                        {templates.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-slate-500">Template Anda</h5>
                                <div className="space-y-2">
                                    {templates.map((template) => (
                                        <div key={template.id} className="p-3 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-sm text-slate-900 dark:text-white">{template.name}</p>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded",
                                                    template.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                )}>
                                                    {template.type === "income" ? "+" : "-"} Rp {template.amount.toLocaleString("id-ID")}
                                                </span>
                                                <span>•</span>
                                                <span className="truncate">{categories.find(c => c.id === template.categoryId)?.name || "-"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {templates.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Belum ada template</p>
                                <p className="text-xs">Buat template untuk transaksi yang sering dilakukan</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Tags Tab */}
                {activeTab === "tags" && (
                    <motion.div
                        key="tags"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Add Tag */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            {!showAddTag ? (
                                <button
                                    onClick={() => setShowAddTag(true)}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus size={16} />
                                    Tambah Tag Baru
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTag.name}
                                            onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Nama tag..."
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                                        />
                                        <button
                                            onClick={() => setShowAddTag(false)}
                                            className="p-2.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {tagColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewTag(prev => ({ ...prev, color }))}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg transition-all",
                                                    newTag.color === color ? "ring-2 ring-offset-2 ring-slate-400" : ""
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Simpan Tag
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tags List */}
                        {tags.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-slate-500">Tag Anda</h5>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <div 
                                            key={tag.id} 
                                            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            #{tag.name}
                                            <button
                                                onClick={() => handleDeleteTag(tag.id)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tags.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <Hash size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Belum ada tag</p>
                                <p className="text-xs">Gunakan tag untuk mengelompokkan transaksi</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
