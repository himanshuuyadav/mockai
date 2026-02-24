type MetricCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export function MetricCard({ label, value, delta }: MetricCardProps) {
  return (
    <article className="panel space-y-2 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      {delta ? <p className="text-xs text-slate-500">{delta}</p> : null}
    </article>
  );
}
