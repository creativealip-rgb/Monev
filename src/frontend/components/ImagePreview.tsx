"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/frontend/lib/utils";

interface ImagePreviewProps {
    src: string;
    onRemove: () => void;
    onConfirm: () => void;
    isProcessing?: boolean;
    processingText?: string;
}

export function ImagePreview({ 
    src, 
    onRemove, 
    onConfirm,
    isProcessing = false,
    processingText = "Memproses gambar..."
}: ImagePreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 0.5));
    const handleRotate = () => setRotation(r => r + 90);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || zoom <= 1) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="relative bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
            {/* Image Container */}
            <div 
                ref={containerRef}
                className={cn(
                    "relative w-full h-64 overflow-hidden cursor-grab active:cursor-grabbing",
                    zoom <= 1 && "cursor-default"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <motion.div
                    animate={{
                        scale: zoom,
                        rotate: rotation,
                        x: position.x,
                        y: position.y
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full h-full flex items-center justify-center"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                    />
                </motion.div>

                {/* Processing Overlay */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
                        >
                            <Loader2 size={40} className="text-white animate-spin mb-3" />
                            <p className="text-white font-medium">{processingText}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-medium text-slate-500 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button
                        onClick={handleRotate}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Rotate"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
                        title="Reset"
                    >
                        Reset
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onRemove}
                        disabled={isProcessing}
                        className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 disabled:opacity-30 transition-colors"
                        title="Remove"
                    >
                        <X size={18} />
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Check size={16} />
                        Proses
                    </button>
                </div>
            </div>

            {/* Hint */}
            {zoom > 1 && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full pointer-events-none">
                    Drag to pan • Scroll to zoom
                </div>
            )}
        </div>
    );
}
