"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

interface InfiniteScrollListProps<T> {
    initialData: T[];
    initialPagination: PaginationInfo;
    fetchFn: (offset: number, limit: number) => Promise<{ data: T[]; pagination: PaginationInfo }>;
    renderItem: (item: T, index: number) => ReactNode;
    renderSkeleton?: () => ReactNode;
    emptyMessage?: string;
    className?: string;
    threshold?: number;
    limit?: number;
}

export function InfiniteScrollList<T>({
    initialData,
    initialPagination,
    fetchFn,
    renderItem,
    renderSkeleton,
    emptyMessage = "Tidak ada data",
    className = "",
    threshold = 200,
    limit = 20,
}: InfiniteScrollListProps<T>) {
    const [items, setItems] = useState<T[]>(initialData);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !pagination.hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const newOffset = items.length;
            const result = await fetchFn(newOffset, limit);
            
            setItems(prev => [...prev, ...result.data]);
            setPagination(result.pagination);
        } catch (err) {
            setError("Gagal memuat data");
            console.error("Error loading more:", err);
        } finally {
            setLoading(false);
        }
    }, [loading, pagination.hasMore, items.length, fetchFn, limit]);

    // Set up intersection observer
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && pagination.hasMore && !loading) {
                    loadMore();
                }
            },
            { rootMargin: `${threshold}px` }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loadMore, pagination.hasMore, loading, threshold]);

    // Reset when initial data changes
    useEffect(() => {
        setItems(initialData);
        setPagination(initialPagination);
    }, [initialData, initialPagination]);

    return (
        <div className={className}>
            {items.length === 0 && !loading ? (
                <div className="text-center py-8 glass-card border-dashed border-slate-300/50">
                    <p className="text-slate-500 font-bold">{emptyMessage}</p>
                </div>
            ) : (
                <>
                    {items.map((item, index) => renderItem(item, index))}
                    
                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="py-4">
                        {loading && (
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <Loader2 size={20} className="animate-spin" />
                                <span className="text-sm">Memuat lebih banyak...</span>
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-center">
                                <p className="text-rose-500 text-sm">{error}</p>
                                <button
                                    onClick={loadMore}
                                    className="text-blue-600 text-sm font-medium hover:underline mt-1"
                                >
                                    Coba lagi
                                </button>
                            </div>
                        )}

                        {!pagination.hasMore && items.length > 0 && (
                            <p className="text-center text-slate-400 text-sm">
                                Tidak ada lagi data
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Skeleton component for loading states
export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-28 bg-slate-100 rounded-full" />
                            <div className="h-3 w-16 bg-slate-50 rounded-full" />
                        </div>
                        <div className="h-5 w-20 bg-slate-100 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
