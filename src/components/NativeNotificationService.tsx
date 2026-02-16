'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NotificationsListener } from 'capacitor-notifications-listener';

export const NativeNotificationService = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const setupListener = async () => {
            try {
                // 1. Check if we're already listening
                const { value: isListening } = await NotificationsListener.isListening();

                if (!isListening) {
                    // 2. Start listening (this might trigger permission request if not granted)
                    // We can also call requestPermission() explicitly if needed
                    await NotificationsListener.startListening({
                        cacheNotifications: false, // We handle them live
                        packagesWhitelist: null, // Listen to all apps, or we can filter here
                    });
                }

                // 3. Add listener for received notifications
                const listener = await NotificationsListener.addListener('notificationReceivedEvent', async (notification: any) => {
                    console.log('Native Notification Received:', notification);

                    try {
                        // Forward to our internal webhook endpoint
                        // Since this is a server action/API call, we'll use a relative path
                        // Capacitor with server.url will handle the base URL
                        const response = await fetch('/api/notification-webhook', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                app: notification.package,
                                title: notification.title,
                                body: notification.text,
                                timestamp: notification.time,
                                // We need the API key here, but since it's client side, 
                                // it's better to have a dedicated internal endpoint that 
                                // doesn't require a public API key for native app internal calls
                                // OR we fetch the key from the server once.
                                apiKey: process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY || 'NATIVE_INTERNAL',
                            }),
                        });

                        const result = await response.json();
                        console.log('Webhook Process Result:', result);
                    } catch (error) {
                        console.error('Error forwarding native notification:', error);
                    }
                });

                return () => {
                    listener.remove();
                };
            } catch (error) {
                console.error('Failed to setup Native Notification Listener:', error);
            }
        };

        setupListener();
    }, []);

    return null; // This component doesn't render anything
};
