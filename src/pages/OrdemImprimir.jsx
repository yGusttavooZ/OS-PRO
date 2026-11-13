import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, UserRound, Laptop, ClipboardList, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/lib/TenantContext";
import { paged } from "@/lib/tenant";
import { brl, formatDoc, formatPhone, shortDate } from "@/lib/format";
import CompanyLogo from "@/components/CompanyLogo";

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-foreground">{children}</h2>
    </div>
  );
}

function InfoLine({ children }) {
  if (!children) return null;
  return <p className="mt-1 break-words text-[11px] leading-relaxed text-muted-foreground">{children}</p>;
}

export default function OrdemImprimir() {
  const { id } = useParams();
  const { company } = useTenant();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    let active = true;
    (async () => {
      try {
        const rows = await paged("ServiceOrder", { id, company_id: company.id }, { limit: 1 });
        if (active) setOrder(rows[0] || null);
      } catch (error) {
        console.error("Falha ao carregar documento para impressão", error);
        if (active) setOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, company?.id]);

  useEffect(() => {
    if (!order) return;
    const previous = document.title;
    document.title = `${order.number_label} - ${company?.name || "Documento"}`;
    return () => { document.title = previous; };
  }, [order, company]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!order) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <p className="font-heading text-lg font-bold">Documento não encontrado</p>
          <Button asChild className="mt-4"><Link to="/ordens">Voltar para a lista</Link></Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const address = [company?.address, company?.address_number, company?.district, company?.city, company?.state].filter(Boolean).join(", ");
  const docType = order.doc_type === "orcamento" ? "Orçamento" : "Ordem de Serviço";
  const warrantyDays = Number(order.warranty_days) > 0 ? Number(order.warranty_days) : Number(company?.warranty_days) > 0 ? Number(company.warranty_days) : 90;
  const status = order.status || "Não informado";

  return (
    <div className="min-h-screen bg-muted/40 px-3 py-6 print:bg-white print:p-0 sm:px-5">
      <div className="mx-auto mb-4 flex max-w-[850px] items-center justify-between no-print">
        <Button asChild variant="ghost" className="gap-1.5"><Link to={`/ordens/${order.id}`}><ArrowLeft className="h-4 w-4" /> Voltar</Link></Button>
        <Button onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Imprimir / Salvar PDF</Button>
      </div>

      <article className="mx-auto max-w-[850px] overflow-hidden border border-border bg-card text-card-foreground shadow-sm print:max-w-none print:border-0 print:shadow-none">
        <header className="border-b border-border px-6 py-7 sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <CompanyLogo
                company={company}
                className="h-[68px] w-[68px] shrink-0 rounded-xl object-contain"
                fallback={<span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground">{(company?.name || "OS").slice(0, 2).toUpperCase()}</span>}
              />
              <div className="min-w-0 pt-1">
                <h1 className="font-heading text-xl font-extrabold leading-tight tracking-tight">{company?.name || "Empresa"}</h1>
                {company?.trade_name && company.trade_name !== company.name && <p className="mt-0.5 text-xs text-muted-foreground">{company.trade_name}</p>}
                {company?.document && <InfoLine>CNPJ/CPF: {formatDoc(company.document)}</InfoLine>}
                {address && <InfoLine>{address}</InfoLine>}
                {(company?.phone || company?.whatsapp) && (
                  <InfoLine>
                    {[company?.phone && formatPhone(company.phone), company?.whatsapp && `WhatsApp: ${formatPhone(company.whatsapp)}`].filter(Boolean).join(" · ")}
                  </InfoLine>
                )}
                {company?.email && <InfoLine>{company.email}</InfoLine>}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3 sm:min-w-[205px] sm:flex-col sm:items-end sm:bg-transparent sm:px-0 sm:py-0">
              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{docType}</p>
                <p className="mt-1 font-heading text-[27px] font-extrabold leading-none tracking-tight">{order.number_label}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Emitido em {shortDate(order.created_date)}</p>
              </div>
              <span className="inline-flex max-w-[150px] items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">{status}</span>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-6 py-6 sm:px-10 sm:py-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <SectionTitle icon={UserRound}>Dados do cliente</SectionTitle>
              <p className="text-sm font-bold">{order.client_name || "—"}</p>
              {order.client_document && <InfoLine>Documento: {formatDoc(order.client_document)}</InfoLine>}
              {order.client_phone && <InfoLine>Telefone: {formatPhone(order.client_phone)}</InfoLine>}
              {order.client_email && <InfoLine>{order.client_email}</InfoLine>}
              {order.client_address && <InfoLine>{order.client_address}</InfoLine>}
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <SectionTitle icon={Laptop}>Equipamento</SectionTitle>
              <p className="text-sm font-bold">{order.equipment_name || "—"}</p>
              <InfoLine>{[order.equipment_brand, order.equipment_model].filter(Boolean).join(" · ") || "Marca/modelo não informado"}</InfoLine>
              {order.equipment_serial && <InfoLine>Número de série: {order.equipment_serial}</InfoLine>}
              {order.equipment_accessories && <InfoLine>Acessórios: {order.equipment_accessories}</InfoLine>}
              {order.equipment_condition && <InfoLine>Estado de entrada: {order.equipment_condition}</InfoLine>}
            </div>
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>Informações do atendimento</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Defeito relatado</p>
                <p className="whitespace-pre-line text-xs leading-relaxed">{order.reported_issue || "Não informado"}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Diagnóstico técnico</p>
                <p className="whitespace-pre-line text-xs leading-relaxed">{order.diagnosis || "Não informado"}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Solução aplicada</p>
                <p className="whitespace-pre-line text-xs leading-relaxed">{order.solution || "Não informado"}</p>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>Serviços e peças</SectionTitle>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="text-left text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3">Descrição</th>
                    <th className="w-14 px-2 py-3 text-center">Qtd.</th>
                    <th className="w-24 px-2 py-3 text-right">Unitário</th>
                    <th className="w-24 px-3 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">Nenhum serviço ou peça lançado nesta ordem.</td></tr>
                  ) : items.map((item, index) => (
                    <tr key={index} className="border-t border-border/70">
                      <td className="px-3 py-3">
                        <span className="font-medium">{item.description}</span>
                        <span className="ml-2 text-[9px] uppercase text-muted-foreground">{item.kind === "part" ? "Peça" : "Serviço"}</span>
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums">{item.qty}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{brl(item.unit_price)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{brl((Number(item.qty) || 0) * (Number(item.unit_price) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-full rounded-xl border border-border bg-muted/20 p-4 sm:w-[290px]">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Serviços</span><span className="tabular-nums">{brl(order.services_total)}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Peças</span><span className="tabular-nums">{brl(order.parts_total)}</span></div>
                  {Number(order.discount) > 0 && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Desconto</span><span className="tabular-nums">− {brl(order.discount)}</span></div>}
                  {Number(order.surcharge) > 0 && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Acréscimo</span><span className="tabular-nums">+ {brl(order.surcharge)}</span></div>}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                  <span className="font-heading text-xl font-extrabold tabular-nums text-primary">{brl(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <SectionTitle icon={ShieldCheck}>Garantia e condições</SectionTitle>
            <p className="text-xs font-bold">Prazo de garantia: {warrantyDays} dias</p>
            <p className="mt-2 whitespace-pre-line text-[10px] leading-[1.65] text-muted-foreground">{order.warranty_terms || company?.warranty_terms || "Garantia sobre os serviços executados e peças substituídas."}</p>
          </section>

          <section className="grid gap-10 px-2 pt-7 sm:grid-cols-2 sm:gap-14">
            <div className="pt-8 text-center">
              <div className="border-t border-foreground/40 pt-2 text-xs font-semibold">{order.client_name || "Cliente"}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">Assinatura do cliente</p>
            </div>
            <div className="pt-8 text-center">
              <div className="border-t border-foreground/40 pt-2 text-xs font-semibold">{order.technician || company?.tech_responsible || "Responsável técnico"}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">Responsável técnico</p>
            </div>
          </section>
        </div>

        <footer className="border-t border-border bg-muted/20 px-6 py-4 text-center text-[9px] leading-relaxed text-muted-foreground sm:px-10 print:bg-white">
          {company?.doc_footer || `${company?.name || ""} · ${company?.phone ? formatPhone(company.phone) : ""}`}
        </footer>
      </article>

      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          article {
            width: 122%;
            max-width: none !important;
            zoom: 0.82;
            border: 0 !important;
            box-shadow: none !important;
          }
          article > header { padding-top: 14px !important; padding-bottom: 14px !important; }
          article > div { padding-top: 14px !important; padding-bottom: 14px !important; }
          article .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 12px !important; }
          article section { break-inside: avoid; }
          article header, article footer, article table, article tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
