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

type TimelineMarker = {
  marker: string;
  confidence: number;
  clarity: number;
  technicalDepth: number;
  fillerWords: number;
  speakingSpeedWpm: number;
};

export function ReportCharts({ timelineMarkers }: { timelineMarkers: TimelineMarker[] }) {
  if (!timelineMarkers.length) {
    return null;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Performance Timeline</h3>
        <div className="mt-3 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={timelineMarkers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="marker" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line dataKey="confidence" name="Confidence" stroke="#2563eb" strokeWidth={2} type="monotone" />
              <Line dataKey="clarity" name="Clarity" stroke="#16a34a" strokeWidth={2} type="monotone" />
              <Line dataKey="technicalDepth" name="Technical Depth" stroke="#f59e0b" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Delivery Metrics</h3>
        <div className="mt-3 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={timelineMarkers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="marker" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="speakingSpeedWpm" fill="#0ea5e9" name="WPM" />
              <Bar dataKey="fillerWords" fill="#ef4444" name="Filler Words" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
