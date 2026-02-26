"use client";

import { useNetworkStatus } from '@/frontend/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
    const { isOnline } = useNetworkStatus();

    if (isOnline) {
        return null; // Don't show anything when online
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-1 bg-amber-500 text-white text-xs font-medium shadow-sm safe-area-top transition-all duration-300">
            <WifiOff className="w-4 h-4 mr-2" />
            <span>Mode Offline - Perubahan akan disinkronkan nanti</span>
        </div>
    );
}
