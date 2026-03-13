"use client";

import { useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

type TransactionEventType = "transactionAdded" | "transactionUpdated" | "transactionDeleted";

export function useTransactionEvents(
    callback: () => void,
    events: TransactionEventType[] = ["transactionAdded"]
) {
    const handleEvent = useCallback(() => {
        logger.debug(`[useTransactionEvents] Event received:`, events);
        callback();
    }, [callback, events]);

    useEffect(() => {
        events.forEach(event => {
            window.addEventListener(event, handleEvent);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        };
    }, [handleEvent, events]);
}

export function dispatchTransactionEvent(event: TransactionEventType) {
    logger.debug(`[useTransactionEvents] Dispatching event: ${event}`);
    window.dispatchEvent(new CustomEvent(event));
}
