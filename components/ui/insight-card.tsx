type InsightCardProps = {
  title: string;
  description: string;
};

export function InsightCard({ title, description }: InsightCardProps) {
  return (
    <article className="panel p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}
