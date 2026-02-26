"use client";

import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';

/**
 * Custom hook to monitor device network connection status.
 * Uses Capacitor's Network plugin for reliable native detection.
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
        let mounted = true;

        // Fetch initial status
        const fetchStatus = async () => {
            try {
                const status = await Network.getStatus();
                if (mounted) {
                    setIsOnline(status.connected);
                    setConnectionType(status.connectionType);
                }
            } catch (err) {
                // If the app is running in standard browser without Capacitor full support, 
                // fallback to standard browser APIs.
                console.warn('Network Plugin not available, using fallback.', err);
                if (mounted) {
                    setIsOnline(navigator.onLine);
                }
            }
        };

        fetchStatus();

        // Listen for network status changes natively
        const listener = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
            if (mounted) {
                setIsOnline(status.connected);
                setConnectionType(status.connectionType);
                console.log(`[NetworkStatus] Connection changed: ${status.connected ? 'ONLINE' : 'OFFLINE'} (${status.connectionType})`);

                // Dispatch a global Window event so other parts of the app can listen
                // easily without adopting the React hook (e.g., standard event listeners)
                if (status.connected) {
                    window.dispatchEvent(new Event('capacitor_online'));
                } else {
                    window.dispatchEvent(new Event('capacitor_offline'));
                }
            }
        });

        // Fallback standard browser events in case Capacitor fails to load properly on web
        const handleOnline = () => {
            setIsOnline(true);
            setConnectionType('web-fallback');
        };
        const handleOffline = () => {
            setIsOnline(false);
            setConnectionType('none');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            mounted = false;
            // Clean up listener
            listener.then(l => l.remove());
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, connectionType };
}
