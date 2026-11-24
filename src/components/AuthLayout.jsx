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
        <aside className={`relative hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex ${loginMode ? "bg-[#eef5f0] text-[#142d21] xl:p-14" : "bg-[#071b16] text-white auth-panel"}`}>
          {loginMode ? (
            <>
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute -right-28 -top-28 h-[34rem] w-[34rem] rounded-full bg-emerald-200/50 blur-[100px]" />
                <div className="absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-teal-100/80 blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.28]" style={{ backgroundImage: "radial-gradient(#789989 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123d2c] shadow-lg shadow-emerald-950/10">
                    <BrandMark className="h-8 w-8 text-white" />
                  </span>
                  <div className="leading-tight">
                    <p className="font-heading text-[19px] font-extrabold tracking-[-0.04em] text-[#153b2b]">OS PRO</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#668273]">Gestão para assistências</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#cbded2] bg-white/70 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3c7056] shadow-sm">Conheça a plataforma</span>
              </div>

              <div className="relative my-10 max-w-[700px]">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9dfd1] bg-white/70 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#367452] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Sua rotina, mais simples
                </p>
                <h2 className="max-w-[650px] font-heading text-[43px] font-extrabold leading-[1.04] tracking-[-0.06em] text-[#142d21] xl:text-[58px]">
                  Menos tarefas espalhadas.
                  <span className="mt-1 block text-[#26845e]">Mais controle do seu negócio.</span>
                </h2>
                <p className="mt-6 max-w-[530px] text-[15px] leading-7 text-[#587064]">
                  O OS-PRO reúne as principais ferramentas da sua assistência técnica para você organizar serviços, atender clientes e acompanhar os resultados em um só lugar.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {["Ordens de serviço", "Clientes e equipamentos", "Orçamentos", "Financeiro"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2 rounded-xl border border-[#d5e4da] bg-white/80 px-3 py-2.5 text-[11px] font-semibold text-[#315c46] shadow-[0_5px_18px_-14px_rgba(20,60,40,.35)]">
                      <Check className="h-3.5 w-3.5 text-[#299366]" /> {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative max-w-[700px] rounded-[26px] border border-white bg-white/90 p-4 shadow-[0_30px_80px_-38px_rgba(31,75,51,.30)] ring-1 ring-[#dce9df] backdrop-blur-xl xl:p-5">
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
                  <div>
                    <p className="text-[12px] font-bold text-[#1c3829]">Visão geral da assistência</p>
                    <p className="mt-1 text-[9px] text-[#82958a]">Exemplo ilustrativo de organização</p>
                  </div>
                  <span className="rounded-full bg-[#eaf6ee] px-3 py-1.5 text-[9px] font-bold text-[#34805a]">PAINEL OS-PRO</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 py-4">
                  {[
                    { label: "Ordens abertas", value: "24", note: "Acompanhe serviços" },
                    { label: "Em andamento", value: "08", note: "Veja cada etapa" },
                    { label: "Finalizadas", value: "56", note: "Histórico acessível" },
                  ].map((item, index) => (
                    <div key={item.label} className="rounded-2xl border border-[#e8f0ea] bg-[#fbfdfb] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-amber-400" : index === 1 ? "bg-sky-400" : "bg-emerald-500"}`} />
                        <span className="text-[8px] font-semibold uppercase tracking-wide text-[#9aaba0]">OS</span>
                      </div>
                      <p className="font-heading text-[25px] font-extrabold tracking-tight text-[#1d3d2c]">{item.value}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#526d5d]">{item.label}</p>
                      <p className="mt-1 text-[8px] text-[#9aaba0]">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-[#f4f8f5] p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#365443]">Etapas de uma ordem de serviço</p>
                    <p className="text-[8px] text-[#91a399]">Fluxo de trabalho</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["Recebimento", "Avaliação", "Execução", "Entrega"].map((step, index) => (
                      <div key={step}>
                        <div className={`h-1.5 rounded-full ${index < 3 ? "bg-[#55a77a]" : "bg-[#dce8df]"}`} />
                        <p className="mt-2 truncate text-[8px] font-medium text-[#718779]">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative mt-6 flex items-center gap-2 text-[10px] font-medium text-[#668273]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#39865d]" />
                Acesso protegido · Informações separadas por empresa
              </div>
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
