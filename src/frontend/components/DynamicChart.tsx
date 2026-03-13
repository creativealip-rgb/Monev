"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoadingFallback = () => (
    <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
);

export const DynamicSankeyChart = dynamic(
    () => import("./SankeyFlowChart").then(mod => mod.SankeyFlowChart),
    { loading: () => <LoadingFallback /> }
);

export function ChartWrapper({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
