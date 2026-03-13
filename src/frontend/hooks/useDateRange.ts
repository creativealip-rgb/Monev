"use client";

import { useMemo } from "react";

export function useMonthDateRange(year: number, month: number) {
    return useMemo(() => {
        const start = new Date(year, month - 1, 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date(year, month, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [year, month]);
}

export function useDateRange(startDate: Date | string, endDate: Date | string) {
    return useMemo(() => {
        const start = typeof startDate === "string" ? new Date(startDate) : startDate;
        const end = typeof endDate === "string" ? new Date(endDate) : endDate;

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, [startDate, endDate]);
}

export function useRelativeDateRange(days: number) {
    return useMemo(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const start = new Date();
        start.setDate(start.getDate() - days);
        start.setHours(0, 0, 0, 0);

        return { start, end, days };
    }, [days]);
}
