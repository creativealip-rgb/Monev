"use client";

import { useState, useRef, useCallback } from "react";
import { apiFetch } from "@/frontend/lib/api-client";

export type AIParserStep = "input" | "processing" | "review";

export interface AIResult {
    merchantName: string;
    amount: number;
    description: string;
    category: string;
}

export function useAIParser(onSuccess: (data: AIResult) => void) {
    const [step, setStep] = useState<AIParserStep>("input");
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<AIResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        setStep("input");
        setPreview(null);
        setResult(null);
        setError(null);
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();
    }, []);

    const processImage = useCallback(async (base64: string) => {
        setStep("processing");
        setError(null);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await apiFetch("/api/transactions/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64.split(",")[1] }),
                signal: controller.signal,
                timeout: 45000 // Longer timeout for OCR
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    merchantName: data.data.merchantName || "",
                    amount: data.data.amount || 0,
                    description: data.data.description || "",
                    category: data.data.category || "Lainnya",
                });
                setStep("review");
            } else {
                setError(data.message || data.error || "Gagal memproses gambar");
                setStep("input");
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || "Gagal memproses gambar. Silakan coba lagi.");
                setStep("input");
            }
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result as string);
                processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [processImage]);

    const processVoice = useCallback(async (audioBlob: Blob) => {
        setError(null);
        setStep("processing");
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "voice.webm");

            const response = await apiFetch("/api/transactions/voice", {
                method: "POST",
                body: formData,
                signal: controller.signal,
                timeout: 45000
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    merchantName: data.data.parsed.merchantName || "",
                    amount: data.data.parsed.amount || 0,
                    description: data.data.parsed.description || "",
                    category: data.data.parsed.category || "Lainnya",
                });
                setStep("review");
            } else {
                setError(data.message || data.error || "Gagal memproses suara");
                setStep("input");
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || "Gagal memproses suara. Silakan coba lagi.");
                setStep("input");
            }
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await processVoice(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            setError("Gagal mengakses mikrofon. Silakan cek izin browser.");
        }
    }, [processVoice]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    return {
        step,
        setStep,
        preview,
        result,
        error,
        setError,
        isRecording,
        recordingTime,
        handleFileSelect,
        startRecording,
        stopRecording,
        setResult,
        reset
    };
}
