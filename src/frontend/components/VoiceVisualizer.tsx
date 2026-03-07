"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
    isRecording: boolean;
    recordingTime: number;
}

export function VoiceVisualizer({ isRecording, recordingTime }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (!isRecording || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Setup canvas
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resizeCanvas();

        // Try to get audio input for visualization
        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                dataArrayRef.current = dataArray;
                analyserRef.current = analyser;
            } catch {
                console.log("Audio visualization not available");
            }
        };
        setupAudio();

        // Animation loop
        const bars = 30;
        const barWidth = canvas.offsetWidth / bars;

        const animate = () => {
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            // Get audio data if available
            if (analyserRef.current && dataArrayRef.current) {
                // @ts-ignore
                analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array);
            }

            // Draw bars
            for (let i = 0; i < bars; i++) {
                const x = i * barWidth;

                // Get height from audio data or generate random
                let barHeight = 10;
                if (dataArrayRef.current) {
                    const dataIndex = Math.floor((i / bars) * dataArrayRef.current.length);
                    barHeight = (dataArrayRef.current[dataIndex] / 255) * canvas.offsetHeight * 0.8;
                } else {
                    // Fallback: generate animated random bars
                    barHeight = 10 + Math.sin(Date.now() / 200 + i * 0.5) * 15 + Math.random() * 20;
                }

                // Minimum height
                barHeight = Math.max(barHeight, 5);

                const y = (canvas.offsetHeight - barHeight) / 2;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
                gradient.addColorStop(0, "#0ea5e9");
                gradient.addColorStop(1, "#6366f1");

                ctx.fillStyle = gradient;

                // Draw rounded bar
                const radius = barWidth / 3;
                ctx.beginPath();
                ctx.roundRect(x + 2, y, barWidth - 4, barHeight, radius);
                ctx.fill();
            }

            if (isRecording) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRecording]);

    if (!isRecording) return null;

    return (
        <div className="relative w-full h-24 flex items-center justify-center">
            {/* Recording indicator */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-500 rounded-full"
            />

            {/* Canvas for waveform */}
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
            />

            {/* Recording time */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-500">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </div>
        </div>
    );
}
