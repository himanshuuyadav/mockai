"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/ui/chart-card";

type TrendPoint = {
  label: string;
  confidence: number;
  fillerWords: number;
};

export function PerformanceTrendChart({ trend }: { trend: TrendPoint[] }) {
  return (
    <ChartCard
      description="Confidence and filler words over your latest completed sessions."
      title="Performance Trend"
    >
      {trend.length ? (
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="confidence" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillers" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }} />
            <Area dataKey="confidence" fill="url(#confidence)" stroke="#4f46e5" type="monotone" />
            <Area dataKey="fillerWords" fill="url(#fillers)" stroke="#e11d48" type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Complete at least one interview to unlock analytics.
        </div>
      )}
    </ChartCard>
  );
}
