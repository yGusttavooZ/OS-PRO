import { cn } from "@/lib/utils";

export default function StatCard({ label, value, hint, icon: Icon, tone = "default", delay = 0 }) {
  const tones = {
    default: "bg-primary/[0.08] text-primary ring-primary/10",
    warning: "bg-amber-500/[0.1] text-amber-600 ring-amber-500/15",
    info: "bg-sky-500/[0.1] text-sky-600 ring-sky-500/15",
    success: "bg-emerald-500/[0.1] text-emerald-600 ring-emerald-500/15",
    danger: "bg-rose-500/[0.1] text-rose-600 ring-rose-500/15",
    neutral: "bg-muted text-muted-foreground ring-border",
  };

  return (
    <div
      className="surface-hover group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 animate-rise"
      style={{ animationDelay: `${delay}ms`, boxShadow: "var(--shadow-soft)" }}
    >
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/[0.07] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1", tones[tone])}>
            <Icon className="w-[17px] h-[17px]" />
          </span>
        )}
      </div>
      <p className="mt-4 font-heading text-[27px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
