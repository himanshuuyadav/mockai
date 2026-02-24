type ChartCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="panel space-y-4 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="h-64">{children}</div>
    </article>
  );
}
