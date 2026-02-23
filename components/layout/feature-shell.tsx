type FeatureShellProps = Readonly<{
  title: string;
  description: string;
}>;

export function FeatureShell({ title, description }: FeatureShellProps) {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>
    </main>
  );
}
