import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Printer, Pencil, Loader2, Trash2, FileCheck2, Wallet, Clock,
  User, MonitorSmartphone, ClipboardList, History,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import TransactionDialog from "@/components/finance/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { ORDER_STATUSES, changeOrderStatus, convertQuote, invalidateTenantCache, paged } from "@/lib/tenant";
import { brl, dateTime, formatDoc, formatPhone, shortDate } from "@/lib/format";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="data-row">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

export default function OrdemDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company, user, can } = useTenant();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    const rows = await paged("ServiceOrder", { id, company_id: company.id }, { limit: 1 });
    const found = rows[0];
    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setOrder(found);
    setStatus(found.status);
    const history = await paged("OrderEvent", { company_id: company.id, order_id: id }, { sort: "-at", limit: 60 });
    setEvents(history);
    setLoading(false);
  }, [id, company?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notFound) return;
    const meta = document.createElement("meta");
    meta.name = "prerender-status-code";
    meta.content = "404";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, [notFound]);

  const applyStatus = async () => {
    if (!status || status === order.status) return;
    setWorking(true);
    setError("");
    try {
      await changeOrderStatus({ company, user, order, status, note });
      setNote("");
      invalidateTenantCache("ServiceOrder", "OrderEvent");
      await load();
    } catch (err) {
      setError(err?.message || "Não foi possível alterar o status.");
    } finally {
      setWorking(false);
    }
  };

  const handleConvert = async () => {
    setWorking(true);
    setError("");
    try {
      const created = await convertQuote({ company, user, quote: order });
      navigate(`/ordens/${created.id}`);
    } catch (err) {
      setError(err?.message || "Não foi possível converter o orçamento.");
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    await base44.entities.OrderEvent.deleteMany({ company_id: company.id, order_id: order.id });
    await base44.entities.ServiceOrder.delete(order.id);
    navigate("/ordens");
  };

  if (loading) {
    return (
      <div className="py-20 grid place-items-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading font-bold text-lg">Documento não encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">Ele pode ter sido excluído ou pertence a outra empresa.</p>
        <Button asChild className="mt-4"><Link to="/ordens">Voltar para a lista</Link></Button>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div>
      <PageHeader
        title={`${order.number_label} · ${order.client_name || "Cliente"}`}
        subtitle={`${order.doc_type === "orcamento" ? "Orçamento" : "Ordem de serviço"} aberto em ${shortDate(order.created_date)}`}
        actions={
          <>
            <Button asChild variant="ghost" className="h-10 gap-1.5">
              <Link to="/ordens"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 gap-1.5">
              <Link to={`/ordens/${order.id}/imprimir`}><Printer className="w-4 h-4" /> Documento</Link>
            </Button>
            {can.editRecords && (
              <Button asChild variant="outline" className="h-10 gap-1.5">
                <Link to={`/ordens/${order.id}/editar`}><Pencil className="w-4 h-4" /> Editar</Link>
              </Button>
            )}
            {order.doc_type === "orcamento" && can.editRecords && (
              <Button className="h-10 gap-1.5" onClick={handleConvert} disabled={working}>
                <FileCheck2 className="w-4 h-4" /> Converter em OS
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <StatusBadge status={order.status} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-1 rounded-md">
          {order.doc_type === "orcamento" ? "Orçamento" : "Ordem de serviço"}
        </span>
        {order.technician && (
          <span className="text-[11px] text-muted-foreground">Técnico: {order.technician}</span>
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" /> Cliente
            </h2>
            <p className="font-semibold">{order.client_name || "—"}</p>
            <div className="mt-2 grid sm:grid-cols-2 gap-x-6">
              <InfoRow label="CPF/CNPJ" value={formatDoc(order.client_document)} />
              <InfoRow label="Telefone" value={formatPhone(order.client_phone)} />
              <InfoRow label="E-mail" value={order.client_email} />
              <InfoRow label="Endereço" value={order.client_address} />
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] flex items-center gap-2 mb-3">
              <MonitorSmartphone className="w-4 h-4 text-muted-foreground" /> Equipamento
            </h2>
            <p className="font-semibold">{order.equipment_name || "—"}</p>
            <div className="mt-2 grid sm:grid-cols-2 gap-x-6">
              <InfoRow label="Marca" value={order.equipment_brand} />
              <InfoRow label="Modelo" value={order.equipment_model} />
              <InfoRow label="Nº de série" value={order.equipment_serial} />
              <InfoRow label="Acessórios" value={order.equipment_accessories} />
              <InfoRow label="Estado" value={order.equipment_condition} />
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-muted-foreground" /> Descrição técnica
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="field-label">Defeito relatado</p>
                <p className="mt-1 text-foreground/90 whitespace-pre-line">{order.reported_issue || "—"}</p>
              </div>
              <div>
                <p className="field-label">Diagnóstico</p>
                <p className="mt-1 text-foreground/90 whitespace-pre-line">{order.diagnosis || "—"}</p>
              </div>
              <div>
                <p className="field-label">Solução</p>
                <p className="mt-1 text-foreground/90 whitespace-pre-line">{order.solution || "—"}</p>
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <h2 className="font-heading font-bold text-[15px] p-5 pb-3">Serviços e peças</h2>
            {items.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhum item lançado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                      <th className="font-semibold px-5 py-2.5">Tipo</th>
                      <th className="font-semibold px-5 py-2.5">Descrição</th>
                      <th className="font-semibold px-5 py-2.5 text-center">Qtd.</th>
                      <th className="font-semibold px-5 py-2.5 text-right">Unit.</th>
                      <th className="font-semibold px-5 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">
                          {item.kind === "part" ? "Peça" : "Serviço"}
                        </td>
                        <td className="px-5 py-2.5">{item.description}</td>
                        <td className="px-5 py-2.5 text-center tabular-nums">{item.qty}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums">{brl(item.unit_price)}</td>
                        <td className="px-5 py-2.5 text-right font-semibold tabular-nums">
                          {brl((Number(item.qty) || 0) * (Number(item.unit_price) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-muted-foreground" /> Histórico
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro no histórico.</p>
            ) : (
              <ol className="space-y-4">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        {event.from_status && event.from_status !== event.to_status ? (
                          <>
                            <span className="text-muted-foreground">{event.from_status}</span>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <strong className="font-semibold">{event.to_status}</strong>
                          </>
                        ) : (
                          <strong className="font-semibold">{event.to_status || "Registro"}</strong>
                        )}
                      </p>
                      {event.note && <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {dateTime(event.at)} · {event.user_name || event.user_email}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] mb-4">Resumo financeiro</h2>
            <div className="data-row">
              <span className="text-sm text-muted-foreground">Serviços</span>
              <span className="text-sm font-semibold tabular-nums">{brl(order.services_total)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-muted-foreground">Peças</span>
              <span className="text-sm font-semibold tabular-nums">{brl(order.parts_total)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-muted-foreground">Desconto</span>
              <span className="text-sm text-rose-600 tabular-nums">- {brl(order.discount)}</span>
            </div>
            <div className="data-row">
              <span className="text-sm text-muted-foreground">Acréscimo</span>
              <span className="text-sm tabular-nums">{brl(order.surcharge)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-heading text-xl font-extrabold text-primary tabular-nums">{brl(order.total)}</span>
            </div>
            {can.finance && (
              <Button className="w-full mt-4 h-10 gap-2" onClick={() => setPayOpen(true)}>
                <Wallet className="w-4 h-4" /> Registrar pagamento
              </Button>
            )}
          </section>

          {can.changeStatus && (
            <section className="surface p-5">
              <h2 className="font-heading font-bold text-[15px] flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" /> Atualizar status
              </h2>
              <Label className="field-label">Novo status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="status-note" className="field-label mt-3 block">Observação (opcional)</Label>
              <Textarea id="status-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: cliente aprovou por WhatsApp" className="mt-1.5 min-h-[64px]" />
              <Button className="w-full mt-3" onClick={applyStatus} disabled={working || status === order.status}>
                {working ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Aplicar alteração
              </Button>
            </section>
          )}

          <section className="surface p-5 space-y-2">
            <h2 className="font-heading font-bold text-[15px] mb-2">Dados do atendimento</h2>
            <InfoRow label="Entrada" value={order.entry_time} />
            <InfoRow label="Saída" value={order.exit_time} />
            <InfoRow label="Garantia" value={`${order.warranty_days || 0} dias`} />
            {order.notes && <InfoRow label="Observações" value={order.notes} />}
            {order.source_quote_id && <InfoRow label="Origem" value="Orçamento aprovado" />}
          </section>

          {can.manageTeam && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                  <Trash2 className="w-4 h-4" /> Excluir documento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {order.number_label}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O documento e o histórico de status serão removidos definitivamente. Lançamentos financeiros já
                    registrados são mantidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <TransactionDialog open={payOpen} onOpenChange={setPayOpen} order={order} />
    </div>
  );
}
