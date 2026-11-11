import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/lib/TenantContext";
import { paged } from "@/lib/tenant";
import { brl, formatDoc, formatPhone, shortDate } from "@/lib/format";
import CompanyLogo from "@/components/CompanyLogo";

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
    return () => {
      document.title = previous;
    };
  }, [order, company]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-4">
        <div>
          <p className="font-heading font-bold text-lg">Documento não encontrado</p>
          <Button asChild className="mt-4"><Link to="/ordens">Voltar para a lista</Link></Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const address = [company?.address, company?.address_number, company?.district, company?.city, company?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-muted/40 py-6 print:bg-white print:py-0">
      <div className="max-w-[820px] mx-auto mb-4 px-4 flex items-center justify-between no-print">
        <Button asChild variant="ghost" className="gap-1.5">
          <Link to={`/ordens/${order.id}`}><ArrowLeft className="w-4 h-4" /> Voltar</Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <article className="max-w-[820px] mx-auto bg-card text-card-foreground shadow-sm print:shadow-none border border-border print:border-0 px-8 sm:px-12 py-10 sm:py-12">
        <header className="flex items-start justify-between gap-6 pb-6 border-b-2 border-primary">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo
              company={company}
              className="w-14 h-14 rounded-lg object-contain"
              fallback={
                <span className="w-14 h-14 rounded-lg bg-primary text-primary-foreground grid place-items-center font-heading font-extrabold">
                  GO
                </span>
              }
            />
            <div className="min-w-0">
              <h1 className="font-heading text-lg font-extrabold leading-tight">{company?.name}</h1>
              {company?.trade_name && company.trade_name !== company.name && <p className="text-xs text-muted-foreground">{company.trade_name}</p>}
              {company?.document && <p className="text-xs text-muted-foreground">CNPJ/CPF: {formatDoc(company.document)}</p>}
              {address && <p className="text-xs text-muted-foreground">{address}</p>}
              <p className="text-xs text-muted-foreground">
                {company?.phone && formatPhone(company.phone)}
                {company?.whatsapp ? ` · WhatsApp: ${formatPhone(company.whatsapp)}` : ""}
                {company?.email ? ` · ${company.email}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              {order.doc_type === "orcamento" ? "Orçamento" : "Ordem de serviço"}
            </p>
            <p className="font-heading text-2xl font-extrabold leading-tight">{order.number_label}</p>
            <p className="text-xs text-muted-foreground">Emitido em {shortDate(order.created_date)}</p>
            <p className="text-xs font-semibold mt-1">Status: {order.status}</p>
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-6 py-6 border-b border-border">
          <div>
            <p className="field-label mb-1">Cliente</p>
            <p className="font-semibold">{order.client_name || "—"}</p>
            {order.client_document && <p className="text-xs text-muted-foreground">Documento: {formatDoc(order.client_document)}</p>}
            {order.client_phone && <p className="text-xs text-muted-foreground">Telefone: {formatPhone(order.client_phone)}</p>}
            {order.client_email && <p className="text-xs text-muted-foreground">{order.client_email}</p>}
            {order.client_address && <p className="text-xs text-muted-foreground">{order.client_address}</p>}
          </div>
          <div>
            <p className="field-label mb-1">Equipamento</p>
            <p className="font-semibold">{order.equipment_name || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {[order.equipment_brand, order.equipment_model].filter(Boolean).join(" · ")}
            </p>
            {order.equipment_serial && <p className="text-xs text-muted-foreground">Série: {order.equipment_serial}</p>}
            {order.equipment_accessories && <p className="text-xs text-muted-foreground">Acessórios: {order.equipment_accessories}</p>}
            {order.equipment_condition && <p className="text-xs text-muted-foreground">Estado: {order.equipment_condition}</p>}
          </div>
        </section>

        <section className="py-6 border-b border-border space-y-4">
          <div>
            <p className="field-label mb-1">Defeito relatado</p>
            <p className="text-sm whitespace-pre-line">{order.reported_issue || "—"}</p>
          </div>
          {order.diagnosis && (
            <div>
              <p className="field-label mb-1">Diagnóstico técnico</p>
              <p className="text-sm whitespace-pre-line">{order.diagnosis}</p>
            </div>
          )}
          {order.solution && (
            <div>
              <p className="field-label mb-1">Solução aplicada</p>
              <p className="text-sm whitespace-pre-line">{order.solution}</p>
            </div>
          )}
        </section>

        <section className="py-6 border-b border-border">
          <p className="field-label mb-3">Serviços e peças</p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item lançado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="py-1.5 font-semibold">Descrição</th>
                  <th className="py-1.5 font-semibold text-center w-16">Qtd.</th>
                  <th className="py-1.5 font-semibold text-right w-24">Unit.</th>
                  <th className="py-1.5 font-semibold text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-border/50 last:border-0">
                    <td className="py-2">
                      {item.description}
                      <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                        ({item.kind === "part" ? "peça" : "serviço"})
                      </span>
                    </td>
                    <td className="py-2 text-center tabular-nums">{item.qty}</td>
                    <td className="py-2 text-right tabular-nums">{brl(item.unit_price)}</td>
                    <td className="py-2 text-right tabular-nums">{brl((Number(item.qty) || 0) * (Number(item.unit_price) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 ml-auto w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviços</span>
              <span className="tabular-nums">{brl(order.services_total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peças</span>
              <span className="tabular-nums">{brl(order.parts_total)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="tabular-nums">- {brl(order.discount)}</span>
              </div>
            )}
            {Number(order.surcharge) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acréscimo</span>
                <span className="tabular-nums">{brl(order.surcharge)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-heading font-extrabold text-base">
              <span>Total</span>
              <span className="tabular-nums">{brl(order.total)}</span>
            </div>
          </div>
        </section>

        <section className="py-6">
          <p className="field-label mb-1">Garantia: {Number(order.warranty_days) > 0 ? Number(order.warranty_days) : Number(company?.warranty_days) > 0 ? Number(company.warranty_days) : 90} dias</p>
          <p className="field-label mb-1 mt-3">Termos de garantia</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">
            {order.warranty_terms || company?.warranty_terms || "Garantia sobre os serviços executados e peças substituídas."}
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-10 pt-10 pb-6">
          <div className="text-center">
            <div className="border-t border-foreground/40 pt-2 text-xs">
              {order.client_name || "Cliente"}
              <span className="block text-[10px] text-muted-foreground">Assinatura do cliente</span>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-foreground/40 pt-2 text-xs">
              {order.technician || company?.tech_responsible || "Responsável técnico"}
              <span className="block text-[10px] text-muted-foreground">Responsável técnico</span>
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t border-border text-[10px] text-muted-foreground text-center">
          {company?.doc_footer || `${company?.name || ""} · ${company?.phone ? formatPhone(company.phone) : ""}`}
        </footer>
      </article>
    </div>
  );
}
