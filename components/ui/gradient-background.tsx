export function GradientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-[-20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[130px]" />
      <div className="absolute right-[-20%] top-[10%] h-[540px] w-[540px] rounded-full bg-indigo-500/20 blur-[130px]" />
      <div className="absolute bottom-[-25%] left-[20%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[140px]" />
    </div>
  );
}
