"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { ChartCard } from "@/components/ui/chart-card";

type TimelineMarker = {
  marker: string;
  confidence: number;
  clarity: number;
  technicalDepth: number;
  behavioralDepth: number;
  domainDepth: number;
  fillerWords: number;
  speakingSpeedWpm: number;
};

export function ReportCharts({
  timelineMarkers,
  depthLabel,
}: {
  timelineMarkers: TimelineMarker[];
  depthLabel: string;
}) {
  if (!timelineMarkers.length) {
    return null;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ChartCard description="Confidence, clarity, and depth trajectory over session timeline." title="Performance Timeline">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={timelineMarkers}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="marker" stroke="#64748b" />
            <YAxis domain={[0, 100]} stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }} />
            <Legend />
            <Line dataKey="confidence" name="Confidence" stroke="#4f46e5" strokeWidth={2} type="monotone" />
            <Line dataKey="clarity" name="Clarity" stroke="#059669" strokeWidth={2} type="monotone" />
            <Line dataKey="domainDepth" name={depthLabel} stroke="#d97706" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard description="Answer delivery rhythm and filler usage per question." title="Delivery Metrics">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={timelineMarkers}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="marker" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }} />
            <Legend />
            <Bar dataKey="speakingSpeedWpm" fill="#0284c7" name="WPM" />
            <Bar dataKey="fillerWords" fill="#e11d48" name="Filler Words" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
