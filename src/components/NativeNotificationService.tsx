'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NotificationsListener } from 'capacitor-notifications-listener';

// Keep a global variable outside the component to survive re-renders/Strict Mode
let isInitialized = false;

export const NativeNotificationService = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        if (isInitialized) {
            console.log('Notification listener already initialized. Skipping.');
            return;
        }

        const setupListener = async () => {
            try {
                isInitialized = true;
                console.log('Initializing Native Notification Bridge...');

                // 1. Fetch config first to get telegramId and right apiKey
                const { fetchNotificationConfig } = await import('@/app/(protected)/fitur/actions');
                const config = await fetchNotificationConfig();

                if (!config || !config.telegramId) {
                    console.log('Notification listener skipped: Missing config or Telegram ID');
                    isInitialized = false; // Allow retry if config was missing
                    return;
                }

                // Keep track of processed IDs to prevent spamming duplicates
                const processedIds = new Set<string>();

                // 2. Add listener FIRST so we don't miss any events (including flushed ones)
                const listener = await NotificationsListener.addListener('notificationReceivedEvent', async (notification: any) => {
                    const notifyId = notification.notificationId || `${notification.package}-${notification.time}-${notification.text?.substring(0, 30)}`;

                    if (processedIds.has(notifyId)) {
                        console.log('Skipping duplicate notification:', notifyId);
                        return;
                    }
                    processedIds.add(notifyId);

                    console.log('Native Notification Received:', notification);

                    // Skip the noisy system/ongoing notifications
                    const text = (notification.text || '').toLowerCase();
                    const title = (notification.title || '').toLowerCase();
                    const pkg = (notification.package || '').toLowerCase();

                    // 🛑 ANTI-SPAM & FEEDBACK LOOP FILTER 🛑

                    // 1. Ignore if it's our own app's package
                    if (pkg.includes('creativealip.monev')) return;

                    // 2. Ignore common noisy apps that aren't financial apps
                    if (pkg.includes('xrecorder') || pkg.includes('android.systemui') || pkg.includes('vending')) return;

                    // 3. BREAK THE FEEDBACK LOOP: Ignore our own Telegram Bot messages
                    if (pkg.includes('telegram') || pkg.includes('whatsapp')) {
                        if (text.includes('notifikasi hp dicatat') ||
                            text.includes('berhasil dicatat') ||
                            text.includes('makan & minuman') || // specific confirmed categories
                            text.includes('⏱️ setara') ||       // bot signature
                            text.includes('checking for new messages') ||
                            text.includes('pesan baru')) {
                            console.log('Filtered out Bot/System response to avoid feedback loop');
                            return;
                        }
                    }

                    // 4. Ignore empty or too short content
                    if (text === '' || text.length < 5) {
                        console.log('Skipping empty/too short notification');
                        return;
                    }

                    try {
                        const requestBody = {
                            app: notification.package,
                            title: notification.title,
                            body: notification.text,
                            timestamp: notification.time,
                            notificationId: notification.notificationId, // Passthrough native ID
                            telegramId: config.telegramId,
                            apiKey: config.apiKey,
                        };

                        console.log('DEBUG: Sending to webhook:', requestBody);

                        if (config.apiKey === 'NOT_SET') {
                            console.error('CRITICAL: API Key is NOT_SET. Server needs restart.');
                            return;
                        }

                        const response = await fetch('/api/notification-webhook', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestBody),
                        });

                        const responseText = await response.text();
                        let result;
                        try {
                            result = JSON.parse(responseText);
                        } catch (e) {
                            console.error('Failed to parse server response:', responseText);
                            return;
                        }

                        console.log('Webhook Process Result:', result);

                        if (result.success) {
                            if (result.isDuplicate) {
                                console.log('Duplicate detected by server, skipping alert.');
                                return;
                            }

                            if (!result.message?.includes('ignored')) {
                                console.log('Transaction successfully recorded:', result.parsed);
                            }
                        }
                    } catch (error) {
                        console.error('Error forwarding native notification:', error);
                    }
                });

                // 3. Clear status and ensure bridge is active
                console.log('DEBUG: Initializing bridge with background sync...');

                // ALWAYS call startListening to ensure the native receiver is created
                await NotificationsListener.startListening({
                    cacheNotifications: true, // Enable caching so background notifs aren't lost
                    packagesWhitelist: null,
                    remoteUrl: config.webhookUrl,
                    remoteKey: config.apiKey,
                    remoteTelegramId: String(config.telegramId || ''),
                } as any);

                const { value: nowListening } = await NotificationsListener.isListening();
                if (nowListening) {
                    console.log('Notification listener bridge is active.');
                    // No need to manual restoreCachedNotifications here, 
                    // the native plugin's attachAppStateListener handles it on isActive.
                } else {
                    console.log('Bridge failed, requesting permission...');
                    await NotificationsListener.requestPermission();
                }

                return () => {
                    console.log('DEBUG: Cleaning up listener');
                    listener.remove();
                };
            } catch (error) {
                console.error('Failed to setup Native Notification Listener:', error);
                alert('CRITICAL ERROR setupListener: ' + error);
            }
        };

        setupListener();
    }, []);

    return null; // This component doesn't render anything
};
