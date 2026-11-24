import React from "react";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import BrandMark from "@/components/BrandMark";

const BENEFITS = [
  "Ordens de serviço numeradas",
  "Orçamentos com conversão em OS",
  "Documentos em PDF com sua marca",
  "Financeiro com receitas e despesas",
];

const METRICS = [
  { value: "OS", label: "organizadas" },
  { value: "PDF", label: "com sua marca" },
  { value: "360°", label: "da operação" },
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
  compact = false,
  cardTitle,
  loginMode = false,
}) {
  return (
    <div className={`min-h-screen ${loginMode ? "bg-[#f3f7f5]" : "bg-background"}`}>
      <div className={`grid min-h-screen ${loginMode ? "lg:grid-cols-[1.12fr_0.88fr]" : "lg:grid-cols-[1.05fr_1fr]"}`}>
        <aside className={`relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#071b16] p-10 text-white lg:flex ${loginMode ? "xl:p-14" : "auth-panel"}`}>
          {loginMode ? (
            <>
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
                <div className="absolute -left-40 top-20 h-[34rem] w-[34rem] rounded-full bg-emerald-500/20 blur-[120px]" />
                <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-teal-400/15 blur-[120px]" />
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandMark className="h-12 w-12 shrink-0 text-white" />
                  <div className="leading-tight">
                    <p className="font-heading text-[18px] font-extrabold tracking-[-0.03em]">OS PRO</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-100/50">Gestão inteligente</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/70">Plataforma completa</span>
              </div>

              <div className="relative my-12 max-w-[700px]">
                <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" />
                  CONHEÇA O OS-PRO · GESTÃO PARA ASSISTÊNCIAS
                </p>
                <h2 className="max-w-[680px] font-heading text-[44px] font-extrabold leading-[1.02] tracking-[-0.055em] xl:text-[58px]">
                  Tudo o que sua assistência precisa.
                  <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">Em uma única plataforma.</span>
                </h2>
                <p className="mt-6 max-w-[520px] text-[15px] leading-7 text-slate-300/75">
                  Do primeiro atendimento à entrega do equipamento: centralize sua operação, acompanhe cada serviço e tenha mais clareza sobre o dia a dia da sua empresa.
                </p>

                <div className="mt-9 grid max-w-[590px] grid-cols-3 gap-3">
                  {[
                    { value: "01", label: "Ordens de serviço", detail: "Acompanhe cada etapa" },
                    { value: "02", label: "Clientes e equipamentos", detail: "Tudo bem registrado" },
                    { value: "03", label: "Financeiro", detail: "Receitas e despesas" },
                  ].map((item) => (
                    <div key={item.value} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur">
                      <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-300">{item.value}</p>
                      <p className="mt-2 text-[11px] font-semibold text-white/85">{item.label}</p>
                      <p className="mt-1 text-[9px] text-slate-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative max-w-[690px] rounded-[26px] border border-white/15 bg-[#102820]/90 p-4 shadow-[0_35px_100px_-35px_rgba(0,0,0,.85)] backdrop-blur-xl xl:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><ShieldCheck className="h-4 w-4" /></span>
                    <div>
                      <p className="text-[11px] font-bold text-white">Um painel para sua operação</p>
                      <p className="text-[9px] text-slate-400">Veja como as informações ficam organizadas</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-300">Tudo em um só lugar</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 py-4">
                  {[
                    { label: "Ordens abertas", value: "24", hint: "Visão das pendências" },
                    { label: "Em execução", value: "08", hint: "Serviços em andamento" },
                    { label: "Concluídas", value: "56", hint: "Ordens finalizadas" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3">
                      <p className="text-[9px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1.5 font-heading text-[25px] font-extrabold tracking-tight text-white">{item.value}</p>
                      <p className="mt-1 text-[8px] text-slate-500">{item.hint}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#091e18] p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-white/80">Fluxo de serviços</p>
                    <p className="text-[9px] text-slate-500">Acompanhamento visual</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {["Recebido", "Em análise", "Em execução", "Entregue"].map((step, index) => (
                      <div key={step} className="min-w-0 flex-1">
                        <div className={`h-1.5 rounded-full ${index < 3 ? "bg-gradient-to-r from-emerald-400 to-teal-300" : "bg-white/10"}`} />
                        <p className="mt-2 truncate text-[8px] text-slate-400">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="relative mt-7 flex items-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Acesso protegido e dados separados por empresa
              </p>
            </>
          ) : (
            <>
              <div className="auth-grid pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative flex items-center gap-3">
                <BrandMark className="h-12 w-12 shrink-0 text-white" />
                <div className="leading-tight">
                  <p className="font-heading text-[17px] font-extrabold tracking-[-0.02em]">OS PRO</p>
                  <p className="text-[9.5px] uppercase tracking-[0.3em] text-white/40">Gestão de ordem de serviço</p>
                </div>
              </div>
              <div className="relative max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 ring-1 ring-white/[0.14]"><Sparkles className="h-3 w-3" /> Plataforma completa</span>
                <h2 className="mt-6 font-heading text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] xl:text-[42px]">{panelTitle}</h2>
                <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-white/60">{panelSubtitle}</p>
                <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {BENEFITS.map((item) => <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/80"><span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[hsl(152_68%_50%_/_0.18)] text-[hsl(152_72%_72%)] ring-1 ring-white/10"><Check className="h-[10px] w-[10px]" strokeWidth={3} /></span>{item}</li>)}
                </ul>
                <div className="mt-9 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/[0.09]">
                  <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Exemplo de acompanhamento</p><span className="text-[10px] font-semibold text-white/45">PRÉVIA ILUSTRATIVA</span></div>
                  <div className="mt-4 space-y-3">{PREVIEW_ROWS.map((row) => <div key={row.label}><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="text-white/60">{row.label}</span><span className="font-semibold tabular-nums text-white/85">{row.value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: row.width }} /></div></div>)}</div>
                </div>
              </div>
              <div className="relative"><div className="grid grid-cols-3 gap-3">{METRICS.map((metric) => <div key={metric.label} className="rounded-2xl bg-white/[0.05] px-3.5 py-3 ring-1 ring-white/[0.09]"><p className="font-heading text-[15px] font-extrabold text-white">{metric.value}</p><p className="mt-0.5 text-[10.5px] text-white/45">{metric.label}</p></div>)}</div><p className="mt-5 flex items-center gap-2 text-[11px] text-white/40"><ShieldCheck className="h-3.5 w-3.5" /> Seus dados ficam visíveis apenas para a sua equipe</p></div>
            </>
          )}
        </aside>

        <main className={`relative flex items-center justify-center px-5 sm:px-8 ${loginMode ? "bg-[#f6f9f7] py-10 lg:px-10" : ""} ${compact ? "py-4 lg:py-3" : "py-10"}`}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-primary/[0.08] blur-[110px]" />
            <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-chart-3/[0.09] blur-[110px]" />
          </div>

          <div className={`relative w-full ${loginMode ? "max-w-[410px]" : "max-w-[440px]"} animate-rise ${compact ? "max-lg:py-2" : ""}`}>
            <div className={`${compact ? "mb-5" : "mb-8"} flex items-center justify-center gap-2.5 lg:hidden`}>
              <BrandMark className="h-10 w-10 shrink-0 text-primary" />
              <span className="font-heading text-lg font-extrabold tracking-[-0.02em]">OS PRO</span>
            </div>

            {(title || subtitle) && <div className={`${compact ? "mb-4 lg:mb-5" : "mb-7"} text-center`}>
              <span className={`${compact ? "mb-3 h-12 w-12 rounded-2xl" : "mb-5 h-14 w-14 rounded-2xl"} inline-grid place-items-center border border-primary/15 bg-gradient-to-br from-accent to-card text-primary shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.6)]`}>
                <Icon className={compact ? "h-[22px] w-[22px]" : "h-[25px] w-[25px]"} aria-hidden="true" />
              </span>
              <h1 className="font-heading text-[27px] font-extrabold tracking-[-0.03em] text-foreground sm:text-[31px]">
                {title}
              </h1>
              {subtitle && <p className="mx-auto mt-2 max-w-[330px] text-[13.5px] leading-relaxed text-muted-foreground">{subtitle}</p>}
            </div>}

            <div className={`auth-card relative overflow-hidden ${loginMode ? "rounded-[30px] border border-[#e0eae4] bg-white shadow-[0_28px_90px_-42px_rgba(20,70,45,0.28)]" : "rounded-[28px] border border-border/70 bg-card shadow-[0_24px_80px_-38px_hsl(var(--foreground)/0.22)]"} ${compact ? "p-5 sm:p-6 lg:p-6" : "p-6 sm:p-8 lg:p-9"}`}>
              <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
              {cardTitle && <h1 className="mb-5 text-center font-heading text-[27px] font-extrabold tracking-[-0.03em] text-foreground sm:text-[30px]">{cardTitle}</h1>}
              {children}
            </div>

            {footer && <p className={`${compact ? "mt-4" : "mt-6"} text-center text-[13px] text-muted-foreground`}>{footer}</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
