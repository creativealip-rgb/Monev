import { useState, useEffect } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("LocalStorage");

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            logger.error("Error reading from localStorage", error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            logger.error("Error writing to localStorage", error);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === key && e.newValue) {
                    setStoredValue(JSON.parse(e.newValue));
                }
            };
            window.addEventListener("storage", handleStorageChange);
            return () => window.removeEventListener("storage", handleStorageChange);
        }
    }, [key]);

    return [storedValue, setValue] as const;
}
