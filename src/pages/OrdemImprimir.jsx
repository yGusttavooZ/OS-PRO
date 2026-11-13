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
    return () => { document.title = previous; };
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
  const warrantyDays = order.warranty_days ?? company?.warranty_days ?? 0;
  const warrantyTerms = order.warranty_terms || company?.warranty_terms ||
    `Garantia de ${warrantyDays} dias sobre os serviços executados e peças substituídas.`;

  return (
    <div className="os-print-page min-h-screen bg-muted/40 py-6 print:bg-white print:py-0">
      <div className="os-print-actions max-w-[820px] mx-auto mb-4 px-4 flex items-center justify-between no-print">
        <Button asChild variant="ghost" className="gap-1.5">
          <Link to={`/ordens/${order.id}`}><ArrowLeft className="w-4 h-4" /> Voltar</Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <article className="os-sheet max-w-[820px] mx-auto bg-card text-card-foreground shadow-sm border border-border">
        <header className="os-header">
          <div className="os-company">
            <CompanyLogo
              company={company}
              className="os-logo rounded-lg object-contain"
              fallback={<span className="os-logo os-logo-fallback rounded-lg bg-primary text-primary-foreground grid place-items-center font-heading font-extrabold">OS</span>}
            />
            <div className="os-company-info">
              <h1>{company?.name || "Assistência técnica"}</h1>
              {company?.document && <p>CNPJ/CPF: {formatDoc(company.document)}</p>}
              {address && <p>{address}</p>}
              {(company?.phone || company?.email) && (
                <p>
                  {company?.phone ? formatPhone(company.phone) : ""}
                  {company?.phone && company?.email ? " · " : ""}
                  {company?.email || ""}
                </p>
              )}
            </div>
          </div>
          <div className="os-number">
            <span className="os-kicker">{order.doc_type === "orcamento" ? "Orçamento" : "Ordem de serviço"}</span>
            <strong>{order.number_label}</strong>
            <span>Emitido em {shortDate(order.created_date)}</span>
            <span className="os-status">{order.status}</span>
          </div>
        </header>

        <div className="os-two-columns">
          <section className="os-panel">
            <h2>Cliente</h2>
            <p className="os-main-value">{order.client_name || "—"}</p>
            {order.client_document && <p>Documento: {formatDoc(order.client_document)}</p>}
            {order.client_phone && <p>Telefone: {formatPhone(order.client_phone)}</p>}
            {order.client_email && <p>{order.client_email}</p>}
            {order.client_address && <p>{order.client_address}</p>}
          </section>

          <section className="os-panel">
            <h2>Equipamento</h2>
            <p className="os-main-value">{order.equipment_name || "—"}</p>
            {(order.equipment_brand || order.equipment_model) && (
              <p>{[order.equipment_brand, order.equipment_model].filter(Boolean).join(" · ")}</p>
            )}
            {order.equipment_serial && <p>Série: {order.equipment_serial}</p>}
            {order.equipment_accessories && <p>Acessórios: {order.equipment_accessories}</p>}
            {order.equipment_condition && <p>Estado: {order.equipment_condition}</p>}
          </section>
        </div>

        <section className="os-technical">
          <div className="os-tech-item">
            <h2>Defeito relatado</h2>
            <p>{order.reported_issue || "—"}</p>
          </div>
          <div className="os-tech-item">
            <h2>Diagnóstico técnico</h2>
            <p>{order.diagnosis || "—"}</p>
          </div>
          <div className="os-tech-item">
            <h2>Solução aplicada</h2>
            <p>{order.solution || "—"}</p>
          </div>
        </section>

        <section className="os-items-section">
          <div className="os-section-heading">
            <h2>Serviços e peças</h2>
            <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
          </div>
          {items.length === 0 ? (
            <p className="os-empty-items">Nenhum item lançado.</p>
          ) : (
            <table className="os-items-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th className="os-center">Qtd.</th>
                  <th className="os-right">Unitário</th>
                  <th className="os-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span>{item.description}</span>
                      <small>{item.kind === "part" ? "Peça" : "Serviço"}</small>
                    </td>
                    <td className="os-center">{item.qty}</td>
                    <td className="os-right">{brl(item.unit_price)}</td>
                    <td className="os-right">{brl((Number(item.qty) || 0) * (Number(item.unit_price) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="os-bottom-grid">
          <div className="os-warranty">
            <div className="os-warranty-title">
              <h2>Termos de garantia</h2>
              <strong>{warrantyDays} dias</strong>
            </div>
            <p>{warrantyTerms}</p>
          </div>

          <div className="os-totals">
            <div><span>Serviços</span><strong>{brl(order.services_total)}</strong></div>
            <div><span>Peças</span><strong>{brl(order.parts_total)}</strong></div>
            {Number(order.discount) > 0 && <div><span>Desconto</span><strong>− {brl(order.discount)}</strong></div>}
            {Number(order.surcharge) > 0 && <div><span>Acréscimo</span><strong>{brl(order.surcharge)}</strong></div>}
            <div className="os-grand-total"><span>Total</span><strong>{brl(order.total)}</strong></div>
          </div>
        </section>

        <section className="os-signatures">
          <div>
            <span className="os-signature-name">{order.client_name || "Cliente"}</span>
            <span>Assinatura do cliente</span>
          </div>
          <div>
            <span className="os-signature-name">{order.technician || company?.tech_responsible || "Responsável técnico"}</span>
            <span>Responsável técnico</span>
          </div>
        </section>

        <footer className="os-footer">
          {company?.doc_footer || `${company?.name || ""}${company?.phone ? ` · ${formatPhone(company.phone)}` : ""}`}
        </footer>
      </article>

      <style>{`
        .os-sheet {
          box-sizing: border-box;
          padding: 30px 34px;
          border-radius: 12px;
          color: #202938;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .os-sheet * { box-sizing: border-box; }
        .os-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding-bottom: 17px;
          border-bottom: 2px solid hsl(var(--primary));
        }
        .os-company { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .os-logo { width: 48px; height: 48px; flex: 0 0 48px; }
        .os-logo-fallback { font-size: 17px; }
        .os-company-info { min-width: 0; }
        .os-company-info h1 { margin: 0 0 3px; font-size: 17px; line-height: 1.2; font-weight: 800; color: #172033; }
        .os-company-info p { margin: 1px 0; color: #667085; font-size: 10px; overflow-wrap: anywhere; }
        .os-number { display: flex; flex-direction: column; align-items: flex-end; flex: 0 0 auto; gap: 2px; }
        .os-kicker { color: hsl(var(--primary)); font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
        .os-number > strong { color: #172033; font-size: 23px; line-height: 1.1; letter-spacing: -.04em; }
        .os-number > span:not(.os-kicker):not(.os-status) { color: #667085; font-size: 10px; }
        .os-status { margin-top: 3px; padding: 3px 9px; border-radius: 99px; background: hsl(var(--primary) / .10); color: hsl(var(--primary)); font-size: 9px; font-weight: 700; }
        .os-two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px 0; border-bottom: 1px solid #e5e9f0; }
        .os-panel { min-width: 0; padding: 11px 13px; border: 1px solid #e5e9f0; border-radius: 8px; background: #fafbfc; }
        .os-sheet h2 { margin: 0 0 6px; color: hsl(var(--primary)); font-size: 9px; line-height: 1.25; font-weight: 800; text-transform: uppercase; letter-spacing: .09em; }
        .os-panel p { margin: 2px 0; color: #596579; font-size: 10px; overflow-wrap: anywhere; }
        .os-panel .os-main-value { margin-bottom: 4px; color: #202938; font-size: 12px; font-weight: 700; }
        .os-technical { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 13px 2px; border-bottom: 1px solid #e5e9f0; }
        .os-tech-item { min-width: 0; }
        .os-tech-item p { margin: 0; color: #344054; font-size: 10px; white-space: pre-line; overflow-wrap: anywhere; }
        .os-items-section { padding: 13px 0; border-bottom: 1px solid #e5e9f0; }
        .os-section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
        .os-section-heading h2 { margin: 0; }
        .os-section-heading span { color: #8992a2; font-size: 9px; }
        .os-empty-items { margin: 0; padding: 8px 10px; border-radius: 6px; background: #f7f8fa; color: #7a8494; font-size: 10px; }
        .os-items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .os-items-table th { padding: 6px 7px; background: #f5f7fa; color: #697586; font-size: 8px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: .05em; }
        .os-items-table td { padding: 6px 7px; border-bottom: 1px solid #edf0f4; color: #344054; vertical-align: top; }
        .os-items-table tbody tr:last-child td { border-bottom: 0; }
        .os-items-table td small { display: inline-block; margin-left: 6px; color: #8992a2; font-size: 8px; text-transform: uppercase; }
        .os-center { text-align: center !important; white-space: nowrap; }
        .os-right { text-align: right !important; white-space: nowrap; }
        .os-bottom-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(180px, .8fr); gap: 20px; align-items: start; padding: 13px 0 12px; }
        .os-warranty { min-width: 0; }
        .os-warranty-title { display: flex; align-items: center; gap: 9px; margin-bottom: 5px; }
        .os-warranty-title h2 { margin: 0; }
        .os-warranty-title strong { padding: 2px 7px; border-radius: 5px; background: #f0f3f8; color: #475467; font-size: 9px; }
        .os-warranty p { margin: 0; color: #667085; font-size: 9px; line-height: 1.45; white-space: pre-line; overflow-wrap: anywhere; }
        .os-totals { display: grid; gap: 4px; }
        .os-totals > div { display: flex; justify-content: space-between; gap: 12px; color: #667085; font-size: 10px; }
        .os-totals strong { color: #344054; font-weight: 600; }
        .os-totals .os-grand-total { margin-top: 4px; padding: 8px 10px; border-radius: 7px; background: hsl(var(--primary) / .09); color: #172033; font-size: 12px; font-weight: 800; }
        .os-totals .os-grand-total strong { color: hsl(var(--primary)); font-size: 15px; }
        .os-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 17px 12px 12px; }
        .os-signatures > div { display: flex; flex-direction: column; align-items: center; min-width: 0; padding-top: 7px; border-top: 1px solid #aeb6c2; color: #7a8494; font-size: 9px; text-align: center; }
        .os-signature-name { max-width: 100%; margin-bottom: 2px; color: #344054; font-size: 10px; font-weight: 700; overflow-wrap: anywhere; }
        .os-footer { margin-top: 2px; padding-top: 8px; border-top: 1px solid #e5e9f0; color: #8992a2; font-size: 9px; text-align: center; overflow-wrap: anywhere; }
        @media (max-width: 600px) {
          .os-sheet { padding: 22px 18px; border-radius: 0; }
          .os-header { align-items: flex-start; gap: 10px; }
          .os-logo { width: 40px; height: 40px; flex-basis: 40px; }
          .os-company-info h1 { font-size: 14px; }
          .os-number > strong { font-size: 19px; }
          .os-two-columns { gap: 8px; }
          .os-panel { padding: 9px; }
          .os-technical { gap: 9px; }
          .os-bottom-grid { grid-template-columns: 1fr; gap: 12px; }
        }
        @page { size: A4 portrait; margin: 9mm; }
        @media print {
          html, body, #root { width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print, .os-print-actions { display: none !important; }
          .os-print-page { min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .os-sheet {
            display: flex !important; flex-direction: column !important;
            width: 100% !important; min-height: 279mm !important; max-width: none !important;
            margin: 0 !important; padding: 8mm 8mm 7mm !important;
            border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
            font-size: 10pt !important; line-height: 1.35 !important;
          }
          .os-header { gap: 5mm !important; padding-bottom: 5mm !important; }
          .os-logo { width: 16mm !important; height: 16mm !important; flex-basis: 16mm !important; }
          .os-company { gap: 4mm !important; }
          .os-company-info h1 { font-size: 15pt !important; margin-bottom: 1mm !important; }
          .os-company-info p, .os-number > span:not(.os-kicker):not(.os-status) { font-size: 8.5pt !important; line-height: 1.35 !important; }
          .os-number { gap: 1mm !important; }
          .os-number > strong { font-size: 22pt !important; }
          .os-kicker { font-size: 8pt !important; }
          .os-status { font-size: 8pt !important; padding: 1.5mm 3mm !important; }
          .os-two-columns { gap: 4mm !important; padding: 5mm 0 !important; }
          .os-panel { padding: 4mm !important; }
          .os-sheet h2 { margin-bottom: 2mm !important; font-size: 8pt !important; }
          .os-panel p, .os-tech-item p { font-size: 9pt !important; line-height: 1.35 !important; }
          .os-panel .os-main-value { font-size: 10.5pt !important; }
          .os-technical { gap: 5mm !important; padding: 5mm 1mm !important; }
          .os-items-section { padding: 5mm 0 !important; }
          .os-section-heading { margin-bottom: 2.5mm !important; }
          .os-empty-items { padding: 3mm 4mm !important; font-size: 9pt !important; }
          .os-items-table { font-size: 9pt !important; }
          .os-items-table th { padding: 2.5mm 3mm !important; font-size: 7.5pt !important; }
          .os-items-table td { padding: 2.5mm 3mm !important; }
          .os-items-table td small { font-size: 7.5pt !important; }
          .os-bottom-grid { grid-template-columns: minmax(0, 1.35fr) minmax(48mm, .8fr) !important; gap: 6mm !important; padding: 5mm 0 !important; }
          .os-warranty-title { margin-bottom: 2mm !important; }
          .os-warranty-title strong { font-size: 8pt !important; padding: 1mm 2mm !important; }
          .os-warranty p { font-size: 8.5pt !important; line-height: 1.4 !important; }
          .os-totals { gap: 1.8mm !important; }
          .os-totals > div { font-size: 9pt !important; }
          .os-totals .os-grand-total { margin-top: 2mm !important; padding: 3mm 3.5mm !important; font-size: 10pt !important; }
          .os-totals .os-grand-total strong { font-size: 13pt !important; }
          .os-signatures { gap: 16mm !important; padding: 8mm 4mm 4mm !important; margin-top: auto !important; }
          .os-signatures > div { padding-top: 2.5mm !important; font-size: 8pt !important; }
          .os-signature-name { font-size: 9pt !important; }
          .os-footer { margin-top: 2mm !important; padding-top: 3mm !important; font-size: 8pt !important; }
          .os-header, .os-two-columns, .os-technical, .os-items-section, .os-bottom-grid, .os-signatures, .os-footer { break-inside: avoid; }
          .os-items-table tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
