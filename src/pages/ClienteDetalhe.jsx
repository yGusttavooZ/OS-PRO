import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Plus, MonitorSmartphone, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClientDialog from "@/components/clients/ClientDialog";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/lib/TenantContext";
import { paged } from "@/lib/tenant";
import { brl, formatDoc, formatPhone, shortDate } from "@/lib/format";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export default function ClienteDetalhe() {
  const { id } = useParams();
  const { can } = useTenant();
  const [client, setClient] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    const [clientRows, equipmentRows, orderRows] = await Promise.all([
      paged("Client", { id }, { limit: 1 }),
      paged("Equipment", { client_id: id }, { sort: "-created_date", limit: 100 }),
      paged("ServiceOrder", { client_id: id }, { sort: "-created_date", limit: 100 }),
    ]);
    setClient(clientRows[0] || null);
    setEquipment(equipmentRows);
    setOrders(orderRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 grid place-items-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="font-heading font-bold text-lg">Cliente não encontrado</p>
        <Button asChild className="mt-4"><Link to="/clientes">Voltar para clientes</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={[client.trade_name, client.city, client.state].filter(Boolean).join(" · ") || "Cadastro de cliente"}
        actions={
          <>
            <Button asChild variant="ghost" className="h-10 gap-1.5">
              <Link to="/clientes"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
            </Button>
            {can.editRecords && (
              <Button variant="outline" className="h-10 gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            )}
            {can.editRecords && (
              <Button asChild className="h-10 gap-1.5">
                <Link to="/ordens/nova"><Plus className="w-4 h-4" /> Nova OS</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="surface p-5 lg:col-span-1">
          <h2 className="font-heading font-bold text-[15px] mb-4">Dados do cliente</h2>
          <div className="space-y-3">
            <Field label="CPF/CNPJ" value={formatDoc(client.document)} />
            <Field label="Telefone" value={formatPhone(client.phone)} />
            <Field label="WhatsApp" value={formatPhone(client.whatsapp)} />
            <Field label="E-mail" value={client.email} />
            <Field label="Endereço" value={[client.address, client.address_number].filter(Boolean).join(", ")} />
            <Field label="Bairro" value={client.district} />
            <Field label="Cidade / UF" value={[client.city, client.state].filter(Boolean).join(" / ")} />
            <Field label="CEP" value={client.zip} />
            <Field label="Observações" value={client.notes} />
            <Field label="Cliente desde" value={shortDate(client.created_date)} />
          </div>
        </section>

        <div className="lg:col-span-2 space-y-4">
          <section className="surface overflow-hidden">
            <h2 className="font-heading font-bold text-[15px] p-5 pb-3 flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-muted-foreground" /> Equipamentos ({equipment.length})
            </h2>
            {equipment.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhum equipamento cadastrado para este cliente.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {equipment.map((item) => (
                  <li key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[item.brand, item.model, item.serial].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {shortDate(item.created_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface overflow-hidden">
            <h2 className="font-heading font-bold text-[15px] p-5 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Histórico de atendimentos ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhuma ordem de serviço emitida para este cliente.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                      <th className="font-semibold px-5 py-2.5">Documento</th>
                      <th className="font-semibold px-5 py-2.5">Equipamento</th>
                      <th className="font-semibold px-5 py-2.5">Status</th>
                      <th className="font-semibold px-5 py-2.5">Data</th>
                      <th className="font-semibold px-5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-2.5">
                          <Link to={`/ordens/${order.id}`} className="font-semibold text-primary hover:underline">
                            {order.number_label}
                          </Link>
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground max-w-[160px] truncate">{order.equipment_name}</td>
                        <td className="px-5 py-2.5"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-2.5 text-muted-foreground whitespace-nowrap">{shortDate(order.created_date)}</td>
                        <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{brl(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <ClientDialog open={editOpen} onOpenChange={setEditOpen} client={client} onSaved={load} />
    </div>
  );
}
