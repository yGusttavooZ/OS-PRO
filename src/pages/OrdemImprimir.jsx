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
  const [clientRecord, setClientRecord] = useState(null);
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
    if (!order?.client_id || !company?.id) { setClientRecord(null); return; }
    let active = true;
    paged("Client", { id: order.client_id, company_id: company.id }, { limit: 1 })
      .then((rows) => { if (active) setClientRecord(rows[0] || null); })
      .catch((error) => { console.error("Falha ao carregar dados complementares do cliente", error); if (active) setClientRecord(null); });
    return () => { active = false; };
  }, [order?.client_id, company?.id]);

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
  const usesCompanyWarranty = order.warranty_terms_source === "company_default";
  const warrantyTerms = (usesCompanyWarranty ? company?.warranty_terms : order.warranty_terms)
    || company?.warranty_terms
    || `Garantia de ${warrantyDays} dias sobre os serviços executados e peças substituídas.`;
  const template = company?.os_template === "referencia" ? "referencia" : "profissional";

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

      <article className={`os-sheet os-template-${template} max-w-[820px] mx-auto bg-card text-card-foreground shadow-sm border border-border`}>

        {template === "referencia" ? (
          <div className="os-reference">
            <header className="ref-company">
              <div className="ref-brand">
                <CompanyLogo company={company} className="ref-logo object-contain" fallback={<span className="ref-logo-fallback">OS</span>} />
                <div className="ref-company-info">
                  <strong>{company?.name || "Assistência técnica"}</strong>
                  {company?.document && <span>CNPJ: {formatDoc(company.document)}</span>}
                  {address && <span>{address}{company?.zip ? " · CEP: " + company.zip : ""}</span>}
                  {company?.email && <span>{company.email}</span>}
                </div>
              </div>
              <div className="ref-company-contact">
                {company?.phone && <span>{formatPhone(company.phone)}</span>}
                {company?.whatsapp && <span>{formatPhone(company.whatsapp)}</span>}
                {company?.tech_responsible && <span>Responsável: {company.tech_responsible}</span>}
              </div>
            </header>

            <div className="ref-titlebar">
              <strong>{order.doc_type === "orcamento" ? "ORÇAMENTO" : "ORDEM DE SERVIÇO"} Nº {order.number_label}</strong>
              <span>{shortDate(order.created_date)}</span>
            </div>

            <section className="ref-section">
              <h2>PERÍODO DE EXECUÇÃO</h2>
              <div className="ref-grid ref-execution">
                <div><b>Entrada:</b><span>{shortDate(order.created_date)}</span></div>
                <div><b>Saída:</b><span>{order.completed_date ? shortDate(order.completed_date) : "____/____/______"}</span></div>
              </div>
            </section>

            <section className="ref-section">
              <h2>DADOS DO CLIENTE</h2>
              <div className="ref-grid ref-client-grid">
                <div><b>Razão social:</b><span>{clientRecord?.name || order.client_name || "—"}</span></div>
                <div><b>Nome fantasia:</b><span>{clientRecord?.trade_name || "—"}</span></div>
                <div><b>CNPJ/CPF:</b><span>{formatDoc(clientRecord?.document || order.client_document) || "—"}</span></div>
                <div><b>Endereço:</b><span>{[clientRecord?.address || order.client_address, clientRecord?.address_number, clientRecord?.district].filter(Boolean).join(", ") || "—"}</span></div>
                <div><b>CEP:</b><span>{clientRecord?.zip || "—"}</span></div>
                <div><b>Cidade/UF:</b><span>{[clientRecord?.city, clientRecord?.state].filter(Boolean).join("/") || "—"}</span></div>
                <div><b>Telefone:</b><span>{formatPhone(clientRecord?.phone || order.client_phone) || "—"}</span></div>
                <div><b>E-mail:</b><span>{clientRecord?.email || order.client_email || "—"}</span></div>
              </div>
            </section>

            <section className="ref-section">
              <h2>EQUIPAMENTO</h2>
              <div className="ref-grid ref-equipment-grid">
                <div><b>Nome do equipamento</b><span>{order.equipment_name || "—"}</span></div>
                <div><b>Marca</b><span>{order.equipment_brand || "—"}</span></div>
                <div><b>Modelo</b><span>{order.equipment_model || "—"}</span></div>
                <div><b>Série</b><span>{order.equipment_serial || "—"}</span></div>
              </div>
              <div className="ref-detail"><b>Condições</b><span>{order.equipment_condition || "—"}</span></div>
              <div className="ref-detail"><b>Defeitos</b><span>{order.reported_issue || "—"}</span></div>
              <div className="ref-detail"><b>Acessórios</b><span>{order.equipment_accessories || "—"}</span></div>
              <div className="ref-detail"><b>Termos de garantia</b><span>{warrantyTerms}</span></div>
            </section>

            <section className="ref-section">
              <h2>SERVIÇOS</h2>
              <table className="ref-items">
                <thead><tr><th>ITEM</th><th>NOME</th><th>QTD.</th><th>VR. UNIT.</th><th>SUBTOTAL</th></tr></thead>
                <tbody>
                  {items.map((item,index)=><tr key={index}><td>{index+1}</td><td>{item.description || "—"}</td><td>{item.qty}</td><td>{brl(item.unit_price)}</td><td>{brl((Number(item.qty)||0)*(Number(item.unit_price)||0))}</td></tr>)}
                  {items.length===0&&<tr><td colSpan="5">Nenhum serviço lançado.</td></tr>}
                </tbody>
                <tfoot><tr><th colSpan="4">TOTAL</th><th>{brl(order.total)}</th></tr></tfoot>
              </table>
              <div className="ref-totals">
                {Number(order.services_total)>0&&<div><span>SERVIÇOS:</span><strong>{brl(order.services_total)}</strong></div>}
                {Number(order.parts_total)>0&&<div><span>PEÇAS:</span><strong>{brl(order.parts_total)}</strong></div>}
                {Number(order.discount)>0&&<div><span>DESCONTO:</span><strong>− {brl(order.discount)}</strong></div>}
                {Number(order.surcharge)>0&&<div><span>ACRÉSCIMO:</span><strong>{brl(order.surcharge)}</strong></div>}
                <div className="ref-total"><span>TOTAL:</span><strong>{brl(order.total)}</strong></div>
              </div>
            </section>

            <section className="ref-section">
              <h2>OBSERVAÇÕES</h2>
              <div className="ref-observations">{order.notes || " "}</div>
            </section>

            <section className="ref-signatures">
              <div><span></span><small>Assinatura do cliente</small></div>
              <div><span></span><small>Assinatura do técnico</small></div>
            </section>
            <footer className="ref-footer">{company?.doc_footer || ""}</footer>
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-6 pb-6 border-b-2 border-primary">
              <div className="flex items-start gap-3 min-w-0">
                <CompanyLogo company={company} className="w-14 h-14 rounded-lg object-contain"
                  fallback={<span className="w-14 h-14 rounded-lg bg-primary text-primary-foreground grid place-items-center font-heading font-extrabold">GO</span>} />
                <div className="min-w-0">
                  <h1 className="font-heading text-lg font-extrabold leading-tight">{company?.name}</h1>
                  {company?.document && <p className="text-xs text-muted-foreground">CNPJ/CPF: {formatDoc(company.document)}</p>}
                  {address && <p className="text-xs text-muted-foreground">{address}</p>}
                  <p className="text-xs text-muted-foreground">{company?.phone && formatPhone(company.phone)}{company?.email ? ` · ${company.email}` : ""}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{order.doc_type === "orcamento" ? "Orçamento" : "Ordem de serviço"}</p>
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
                <p className="text-xs text-muted-foreground">{[order.equipment_brand, order.equipment_model].filter(Boolean).join(" · ")}</p>
                {order.equipment_serial && <p className="text-xs text-muted-foreground">Série: {order.equipment_serial}</p>}
                {order.equipment_accessories && <p className="text-xs text-muted-foreground">Acessórios: {order.equipment_accessories}</p>}
                {order.equipment_condition && <p className="text-xs text-muted-foreground">Estado: {order.equipment_condition}</p>}
              </div>
            </section>

            <section className="py-6 border-b border-border space-y-4">
              <div><p className="field-label mb-1">Defeito relatado</p><p className="text-sm whitespace-pre-line">{order.reported_issue || "—"}</p></div>
              {order.diagnosis && <div><p className="field-label mb-1">Diagnóstico técnico</p><p className="text-sm whitespace-pre-line">{order.diagnosis}</p></div>}
              {order.solution && <div><p className="field-label mb-1">Solução aplicada</p><p className="text-sm whitespace-pre-line">{order.solution}</p></div>}
            </section>

            <section className="py-6 border-b border-border">
              <p className="field-label mb-3">Serviços e peças</p>
              {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum item lançado.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="py-1.5 font-semibold">Descrição</th><th className="py-1.5 font-semibold text-center w-16">Qtd.</th><th className="py-1.5 font-semibold text-right w-24">Unit.</th><th className="py-1.5 font-semibold text-right w-28">Subtotal</th>
                  </tr></thead>
                  <tbody>{items.map((item,index)=><tr key={index} className="border-b border-border/50 last:border-0">
                    <td className="py-2">{item.description}<span className="ml-1 text-[10px] uppercase text-muted-foreground">({item.kind === "part" ? "peça" : "serviço"})</span></td>
                    <td className="py-2 text-center tabular-nums">{item.qty}</td><td className="py-2 text-right tabular-nums">{brl(item.unit_price)}</td>
                    <td className="py-2 text-right tabular-nums">{brl((Number(item.qty)||0)*(Number(item.unit_price)||0))}</td>
                  </tr>)}</tbody>
                </table>
              )}
              <div className="mt-4 ml-auto w-full sm:w-72 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Serviços</span><span className="tabular-nums">{brl(order.services_total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Peças</span><span className="tabular-nums">{brl(order.parts_total)}</span></div>
                {Number(order.discount)>0&&<div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="tabular-nums">- {brl(order.discount)}</span></div>}
                {Number(order.surcharge)>0&&<div className="flex justify-between"><span className="text-muted-foreground">Acréscimo</span><span className="tabular-nums">{brl(order.surcharge)}</span></div>}
                <div className="flex justify-between pt-2 border-t border-border font-heading font-extrabold text-base"><span>Total</span><span className="tabular-nums">{brl(order.total)}</span></div>
              </div>
            </section>

            <section className="py-6">
              <p className="field-label mb-1">Termos de garantia</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">{warrantyTerms}</p>
            </section>

            <section className="grid sm:grid-cols-2 gap-10 pt-10 pb-6">
              <div className="text-center"><div className="border-t border-foreground/40 pt-2 text-xs">{order.client_name || "Cliente"}<span className="block text-[10px] text-muted-foreground">Assinatura do cliente</span></div></div>
              <div className="text-center"><div className="border-t border-foreground/40 pt-2 text-xs">{order.technician || company?.tech_responsible || "Responsável técnico"}<span className="block text-[10px] text-muted-foreground">Responsável técnico</span></div></div>
            </section>

            <footer className="pt-4 border-t border-border text-[10px] text-muted-foreground text-center">
              {company?.doc_footer || `${company?.name || ""} · ${company?.phone ? formatPhone(company.phone) : ""}`}
            </footer>
          </>
        )}
      </article>

      <style>{`

        .os-template-referencia { padding: 8mm !important; border-radius: 0 !important; font-family: Arial,Helvetica,sans-serif; font-size: 9px; color:#202020; }
        .os-reference { display:flex; flex-direction:column; gap:6px; }
        .ref-company { display:flex; justify-content:space-between; align-items:center; gap:10px; min-height:82px; padding:5px; border:1px solid #cbd5d1; }
        .ref-brand { display:flex; align-items:center; gap:8px; min-width:0; }
        .ref-logo { width:76px; height:76px; flex:0 0 76px; }
        .ref-logo-fallback { display:grid; place-items:center; width:76px; height:76px; border-radius:50%; background:hsl(var(--primary)); color:white; font-weight:800; }
        .ref-company-info,.ref-company-contact { display:flex; flex-direction:column; min-width:0; font-size:8px; line-height:1.3; }
        .ref-company-info strong { font-size:12px; color:#202020; }
        .ref-company-contact { text-align:right; }
        .ref-titlebar,.ref-section>h2 { background:hsl(var(--primary) / .13); color:#202020; }
        .ref-titlebar { display:flex; justify-content:space-between; align-items:center; padding:4px 6px; font-size:10px; }
        .ref-section { border:1px solid #c9d0cd; }
        .ref-section>h2 { margin:0; padding:3px 5px; font-size:9px; font-weight:800; }
        .ref-grid { display:grid; }
        .ref-execution { grid-template-columns:1fr 1fr; }
        .ref-grid>div { display:flex; align-items:flex-start; gap:5px; min-width:0; padding:4px 5px; border-top:1px solid #d4dad7; }
        .ref-grid b { flex:0 0 auto; }
        .ref-grid span { min-width:0; overflow-wrap:anywhere; }
        .ref-client-grid { grid-template-columns:1fr 1fr; }
        .ref-equipment-grid { grid-template-columns:2fr .8fr 1.3fr .8fr; }
        .ref-equipment-grid>div { flex-direction:column; gap:0; }
        .ref-detail { display:flex; flex-direction:column; gap:0; min-height:28px; padding:4px 7px; border-top:1px solid #d4dad7; }
        .ref-detail span { white-space:pre-line; overflow-wrap:anywhere; }
        .ref-items { width:100%; border-collapse:collapse; font-size:8px; }
        .ref-items th,.ref-items td { padding:4px 5px; border:1px solid #cbd2cf; text-align:left; }
        .ref-items th { background:#f1f3f2; color:#202020; }
        .ref-items td:nth-child(n+3),.ref-items th:nth-child(n+3) { text-align:right; white-space:nowrap; }
        .ref-items tfoot th { background:hsl(var(--primary) / .13); }
        .ref-totals { display:flex; flex-direction:column; align-items:flex-end; gap:2px; padding:5px; background:hsl(var(--primary) / .08); }
        .ref-totals>div { display:flex; gap:8px; min-width:145px; justify-content:space-between; }
        .ref-totals .ref-total { padding-top:3px; border-top:1px solid #aebbb5; font-size:10px; font-weight:800; }
        .ref-observations { min-height:26px; padding:5px; white-space:pre-line; }
        .ref-signatures { display:grid; grid-template-columns:1fr 1fr; gap:35px; padding:17px 8px 9px; border:1px solid #333; }
        .ref-signatures>div { display:flex; flex-direction:column; align-items:center; text-align:center; }
        .ref-signatures span { width:100%; height:18px; border-bottom:1px solid #555; }
        .ref-signatures small { font-size:8px; }
        .ref-footer { padding-top:3px; color:#68736e; font-size:7px; text-align:right; }
        @media(max-width:600px) { .os-template-referencia { padding:12px !important; } .ref-company { align-items:flex-start; } .ref-logo,.ref-logo-fallback { width:48px;height:48px;flex-basis:48px; } .ref-company-contact { display:none; } .ref-equipment-grid { grid-template-columns:1fr 1fr; } }
        @media print { .os-template-referencia { padding:0 !important; font-size:8pt !important; } .os-template-referencia .ref-logo,.os-template-referencia .ref-logo-fallback { width:19mm;height:19mm;flex-basis:19mm; } .os-template-referencia .ref-company { padding:2mm; } .os-template-referencia .ref-section,.os-template-referencia .ref-signatures,.os-template-referencia .ref-titlebar { break-inside:avoid; } .os-template-referencia .ref-items tr { break-inside:avoid; } .os-template-referencia .ref-grid>div,.os-template-referencia .ref-detail { padding:1.5mm 2mm; } .os-template-referencia .ref-signatures { padding:5mm 2mm 3mm; } }

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
        .os-template-compacto { padding: 22px 26px; font-size: 11px; }
        .os-template-compacto .os-header { padding-bottom: 11px; }
        .os-template-compacto .os-logo { width: 54px; height: 54px; flex-basis: 54px; }
        .os-template-compacto .os-two-columns { padding: 9px 0; gap: 8px; }
        .os-template-compacto .os-panel { padding: 8px 10px; }
        .os-template-compacto .os-technical { padding: 6px 2px; }
        .os-template-compacto .os-tech-item { padding: 3px 6px; }
        .os-template-compacto .os-items-section { padding: 9px 0; }
        .os-template-compacto .os-items-table th, .os-template-compacto .os-items-table td { padding-top: 4px; padding-bottom: 4px; }
        .os-template-compacto .os-bottom-grid { padding: 8px 0; gap: 7px; }
        .os-template-compacto .os-signatures { padding-top: 6mm; padding-bottom: 3mm; }
        .os-template-premium { border-top: 5px solid hsl(var(--primary)); }
        .os-template-premium .os-header { padding-bottom: 20px; }
        .os-template-premium .os-number > strong { color: hsl(var(--primary)); }
        .os-template-premium .os-panel { background: #f7faf9; border-color: #d7e7e2; }
        .os-template-premium .os-section-heading { padding: 7px 9px; border-radius: 6px; background: hsl(var(--primary) / .08); }
        .os-template-premium .os-grand-total { box-shadow: inset 0 0 0 1px hsl(var(--primary) / .16); }

        /* Identidade visual distinta por modelo */
        .os-template-compacto {
          padding: 18px 22px;
          border-radius: 4px;
          font-size: 10px;
        }
        .os-template-compacto .os-header {
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid #cbd5e1;
        }
        .os-template-compacto .os-logo { width: 46px; height: 46px; flex-basis: 46px; }
        .os-template-compacto .os-company-info h1 { font-size: 14px; }
        .os-template-compacto .os-number > strong { font-size: 19px; }
        .os-template-compacto .os-panel { border-radius: 4px; background: #fff; }
        .os-template-compacto .os-items-table th { background: #e9edf2; color: #344054; }
        .os-template-compacto .os-tech-item { border-bottom-style: dotted; }
        .os-template-compacto .os-signatures { gap: 28px; }

        .os-template-premium {
          border: 1px solid #b7d7cc;
          border-top: 7px solid #16785f;
          border-radius: 3px;
          background: #fff;
        }
        .os-template-premium .os-header {
          padding: 4px 0 22px;
          border-bottom: 3px solid #16785f;
        }
        .os-template-premium .os-company-info h1 { color: #124b3d; font-size: 19px; }
        .os-template-premium .os-number > strong { color: #16785f; font-size: 27px; }
        .os-template-premium .os-kicker { color: #16785f; }
        .os-template-premium .os-status { background: #e2f2ec; color: #12634e; }
        .os-template-premium .os-panel {
          border: 1px solid #c9e1d8;
          border-radius: 3px;
          background: #f4faf7;
          padding: 14px;
        }
        .os-template-premium .os-sheet h2 { color: #12634e; }
        .os-template-premium .os-tech-item { padding: 8px 10px; }
        .os-template-premium .os-items-table th {
          background: #176b56;
          color: #fff;
          padding-top: 9px;
          padding-bottom: 9px;
        }
        .os-template-premium .os-items-table td { border-bottom-color: #dcece5; }
        .os-template-premium .os-grand-total {
          background: #e5f3ed;
          padding: 8px 12px;
        }
        .os-template-premium .os-grand-total strong { color: #12634e; }
        .os-template-premium .os-warranty {
          padding: 12px;
          border: 1px solid #c9e1d8;
          background: #f4faf7;
        }
        .os-template-premium .os-signatures > div { border-top: 1px solid #16785f; }

        .os-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding-bottom: 17px;
          border-bottom: 2px solid hsl(var(--primary));
        }
        .os-company { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .os-logo { width: 64px; height: 64px; flex: 0 0 64px; }
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
        .os-technical { display: grid; grid-template-columns: 1fr; gap: 0; padding: 10px 2px; border-bottom: 1px solid #e5e9f0; }
        .os-tech-item { display: flex; align-items: baseline; gap: 8px; min-width: 0; padding: 5px 8px; border-bottom: 1px solid #edf0f4; }
        .os-tech-item:last-child { border-bottom: 0; }
        .os-tech-item h2 { flex: 0 0 132px; margin: 0; }
        .os-tech-item p { flex: 1; min-width: 0; margin: 0; color: #344054; font-size: 10px; line-height: 1.4; white-space: pre-line; overflow-wrap: anywhere; }
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
        .os-bottom-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; align-items: start; padding: 13px 0 12px; margin-top: auto; }
        .os-warranty { min-width: 0; }
        .os-warranty-title { display: flex; align-items: center; gap: 9px; margin-bottom: 5px; }
        .os-warranty-title h2 { margin: 0; }
        .os-warranty-title strong { padding: 2px 7px; border-radius: 5px; background: #f0f3f8; color: #475467; font-size: 9px; }
        .os-warranty p { margin: 0; color: #667085; font-size: 9px; line-height: 1.45; white-space: pre-line; overflow-wrap: anywhere; }
        .os-totals { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 14px; width: 100%; }
        .os-totals > div { display: inline-flex; align-items: baseline; justify-content: flex-start; gap: 4px; color: #667085; font-size: 10px; white-space: nowrap; }
        .os-totals strong { color: #344054; font-weight: 600; }
        .os-totals .os-grand-total { margin: 0; padding: 5px 9px; border-radius: 6px; background: hsl(var(--primary) / .09); color: #172033; font-size: 11px; font-weight: 800; }
        .os-totals .os-grand-total strong { color: hsl(var(--primary)); font-size: 13px; }
        .os-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 9mm 12px 5mm; margin-top: 0; }
        .os-signatures > div { display: flex; flex-direction: column; align-items: center; min-width: 0; padding-top: 7px; border-top: 1px solid #aeb6c2; color: #7a8494; font-size: 9px; text-align: center; }
        .os-signature-name { max-width: 100%; margin-bottom: 2px; color: #344054; font-size: 10px; font-weight: 700; overflow-wrap: anywhere; }
        .os-footer { margin-top: 0; padding-top: 3px; border-top: 1px solid #e5e9f0; color: #8992a2; font-size: 9px; text-align: center; overflow-wrap: anywhere; }
        @media (max-width: 600px) {
          .os-sheet { padding: 22px 18px; border-radius: 0; }
          .os-header { align-items: flex-start; gap: 10px; }
          .os-logo { width: 54px; height: 54px; flex-basis: 54px; }
          .os-company-info h1 { font-size: 14px; }
          .os-number > strong { font-size: 19px; }
          .os-two-columns { gap: 8px; }
          .os-panel { padding: 9px; }
          .os-technical { gap: 0; }
          .os-bottom-grid { grid-template-columns: 1fr; gap: 12px; }
          .os-totals { justify-content: flex-start; }
        }
        /* Mantém a leitura do modelo de referência no mesmo padrão do documento original */
        .os-template-referencia { font-size:12px; line-height:1.4; }
        .os-template-referencia .ref-company-info,
        .os-template-referencia .ref-company-contact { font-size:10px; line-height:1.4; }
        .os-template-referencia .ref-company-info strong { font-size:15px; }
        .os-template-referencia .ref-titlebar { font-size:12px; padding:6px 8px; }
        .os-template-referencia .ref-section>h2 { font-size:11px; padding:5px 7px; }
        .os-template-referencia .ref-grid,
        .os-template-referencia .ref-detail,
        .os-template-referencia .ref-observations { font-size:11px; }
        .os-template-referencia .ref-items { font-size:11px; }
        .os-template-referencia .ref-items th,
        .os-template-referencia .ref-items td { padding:6px 7px; }
        .os-template-referencia .ref-totals { font-size:12px; }
        .os-template-referencia .ref-totals .ref-total { font-size:13px; }
        .os-template-referencia .ref-signatures small { font-size:10px; }
        .os-template-referencia .ref-footer { font-size:9px; }
        @media print {
          .os-template-referencia { font-size:10pt !important; line-height:1.35 !important; }
          .os-template-referencia .ref-company-info,
          .os-template-referencia .ref-company-contact { font-size:8.5pt !important; }
          .os-template-referencia .ref-company-info strong { font-size:12pt !important; }
          .os-template-referencia .ref-titlebar { font-size:10pt !important; padding:2mm 2.5mm !important; }
          .os-template-referencia .ref-section>h2 { font-size:8.5pt !important; padding:1.5mm 2mm !important; }
          .os-template-referencia .ref-grid,
          .os-template-referencia .ref-detail,
          .os-template-referencia .ref-observations { font-size:9pt !important; }
          .os-template-referencia .ref-items { font-size:9pt !important; }
          .os-template-referencia .ref-items th,
          .os-template-referencia .ref-items td { padding:2mm 2.2mm !important; }
          .os-template-referencia .ref-totals { font-size:9pt !important; }
          .os-template-referencia .ref-totals .ref-total { font-size:10pt !important; }
          .os-template-referencia .ref-signatures small { font-size:8.5pt !important; }
          .os-template-referencia .ref-footer { font-size:8pt !important; }
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
          .os-logo { width: 20mm !important; height: 20mm !important; flex-basis: 20mm !important; }
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
          .os-panel p, .os-tech-item h2 { flex: 0 0 39mm !important; margin: 0 !important; font-size: 8pt !important; }
          .os-tech-item p { font-size: 9pt !important; line-height: 1.35 !important; }
          .os-panel .os-main-value { font-size: 10.5pt !important; }
          .os-technical { gap: 0 !important; padding: 3mm 1mm !important; }
          .os-tech-item { display: flex !important; align-items: baseline !important; gap: 3mm !important; min-height: 0 !important; padding: 2mm 3mm !important; }
          .os-tech-item h2 { flex: 0 0 38mm !important; margin: 0 !important; }
          .os-tech-item p { font-size: 9pt !important; line-height: 1.35 !important; }
          .os-items-section { padding: 5mm 0 !important; }
          .os-section-heading { margin-bottom: 2.5mm !important; }
          .os-empty-items { padding: 3mm 4mm !important; font-size: 9pt !important; }
          .os-items-table { font-size: 9pt !important; }
          .os-items-table th { padding: 2.5mm 3mm !important; font-size: 7.5pt !important; }
          .os-items-table td { padding: 2.5mm 3mm !important; }
          .os-items-table td small { font-size: 7.5pt !important; }
           .os-bottom-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 3mm !important; padding: 5mm 0 !important; margin-top: auto !important; }
          .os-warranty-title { margin-bottom: 2mm !important; }
          .os-warranty-title strong { font-size: 8pt !important; padding: 1mm 2mm !important; }
          .os-warranty p { font-size: 8.5pt !important; line-height: 1.4 !important; }
           .os-totals { justify-content: space-between !important; gap: 2mm 4mm !important; }
          .os-totals > div { font-size: 8.5pt !important; }
          .os-totals .os-grand-total { margin: 0 !important; padding: 2mm 3mm !important; font-size: 9.5pt !important; }
          .os-totals .os-grand-total strong { font-size: 11pt !important; }
          .os-signatures { gap: 16mm !important; padding: 9mm 4mm 5mm !important; margin-top: 0 !important; }
          .os-signatures > div { padding-top: 2.5mm !important; font-size: 8pt !important; }
          .os-signature-name { font-size: 9pt !important; }
          .os-footer { margin-top: 0 !important; padding-top: 1mm !important; font-size: 8pt !important; }
          .os-header, .os-two-columns, .os-technical, .os-items-section, .os-bottom-grid, .os-signatures, .os-footer { break-inside: avoid; }
          .os-items-table tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
