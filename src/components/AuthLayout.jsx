import React from "react";
import { Check, ShieldCheck, Sparkles, ArrowUpRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const BENEFITS = [
  "Ordens de serviço numeradas",
  "Orçamentos com conversão em OS",
  "Documentos em PDF com sua marca",
  "Financeiro com receitas e despesas",
];

const METRICS = [
  { value: "OS", label: "numeradas" },
  { value: "PDF", label: "com sua marca" },
  { value: "14 dias", label: "de teste grátis" },
];

const PREVIEW_ROWS = [
  { label: "Em execução", value: 8, width: "72%" },
  { label: "Aguardando peça", value: 4, width: "42%" },
  { label: "Entregues", value: 12, width: "92%" },
];

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
  panelTitle = "Gestão completa da sua assistência técnica",
  panelSubtitle = "Ordens de serviço, orçamentos, clientes e financeiro em um só lugar — com os dados da sua empresa totalmente isolados.",
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="auth-panel relative hidden flex-col justify-start overflow-hidden p-8 text-white lg:flex xl:p-10">
          <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div
            className="animate-float pointer-events-none absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-[hsl(152_70%_45%_/_0.14)] blur-[110px]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-[20rem] w-[20rem] rounded-full bg-white/[0.06] blur-[110px]" aria-hidden="true" />

          <div className="relative flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-white/30 to-white/5 font-heading text-[12px] font-extrabold tracking-[0.12em] ring-1 ring-white/25 backdrop-blur">
              <BrandMark className="h-7 w-7 text-white" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-[17px] font-extrabold tracking-[-0.02em]">OS PRO</p>
              <p className="text-[9.5px] uppercase tracking-[0.3em] text-white/40">Gestão de ordem de serviço</p>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 ring-1 ring-white/15 xl:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(152_72%_56%)]" /> Sistema online
            </span>
          </div>

          <div className="relative mt-10 max-w-lg animate-rise">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 ring-1 ring-white/[0.14] backdrop-blur">
              <Sparkles className="h-3 w-3" /> Plataforma completa
            </span>
            <h2 className="mt-4 min-h-[2.12em] font-heading text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] xl:text-[42px]">
              {panelTitle}
            </h2>
            <p className="mt-3 min-h-[4.9em] max-w-md text-[13.5px] leading-relaxed text-white/60">{panelSubtitle}</p>

            <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/80">
                  <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[hsl(152_68%_50%_/_0.18)] text-[hsl(152_72%_72%)] ring-1 ring-white/10">
                    <Check className="h-[10px] w-[10px]" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.09] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Visão da operação</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[hsl(152_72%_72%)]">
                  ao vivo <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {PREVIEW_ROWS.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-white/60">{row.label}</span>
                      <span className="font-semibold tabular-nums text-white/85">{row.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(152_72%_50%)] to-[hsl(174_72%_56%)]"
                        style={{ width: row.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-auto pt-6">
            <div className="grid grid-cols-3 gap-3">
              {METRICS.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/[0.05] px-3.5 py-3 ring-1 ring-white/[0.09] backdrop-blur-sm">
                  <p className="font-heading text-[15px] font-extrabold tracking-[-0.02em] text-white">{metric.value}</p>
                  <p className="mt-0.5 text-[10.5px] text-white/45">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" /> Seus dados ficam visíveis apenas para a sua equipe
            </p>
          </div>
        </aside>

        <main className="relative flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-primary/[0.08] blur-[110px]" />
            <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-chart-3/[0.09] blur-[110px]" />
          </div>

          <div className="relative w-full max-w-[430px] animate-rise">
            <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-3 text-[11px] font-extrabold tracking-[0.1em] text-primary-foreground shadow-sm shadow-primary/25">
                <BrandMark className="h-6 w-6 text-white" />
              </span>
              <span className="font-heading text-lg font-extrabold tracking-[-0.02em]">OS PRO</span>
            </div>

            <div className="mb-7 text-center">
              <span className="mb-5 inline-grid h-14 w-14 place-items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-accent to-card text-primary shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.6)]">
                <Icon className="h-[25px] w-[25px]" aria-hidden="true" />
              </span>
              <h1 className="font-heading text-[27px] font-extrabold tracking-[-0.03em] text-foreground sm:text-[31px]">
                {title}
              </h1>
              {subtitle && <p className="mx-auto mt-2 max-w-[330px] text-[13.5px] leading-relaxed text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="auth-card relative overflow-hidden rounded-[26px] border border-border/70 bg-card p-6 sm:p-8">
              <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
              {children}
            </div>

            {footer && <p className="mt-6 text-center text-[13px] text-muted-foreground">{footer}</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
