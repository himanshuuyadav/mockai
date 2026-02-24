type TimelineItemProps = {
  title: string;
  subtitle?: string;
  body: string;
};

export function TimelineItem({ title, subtitle, body }: TimelineItemProps) {
  return (
    <div className="relative pl-8">
      <span className="absolute left-0 top-3 h-2.5 w-2.5 rounded-full bg-indigo-500" />
      <span className="absolute left-[4px] top-6 h-[calc(100%-1rem)] w-px bg-slate-200" />
      <article className="panel space-y-2 p-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        <p className="text-sm text-slate-700">{body}</p>
      </article>
    </div>
  );
}
