import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, FileText, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/lib/TenantContext";
import { ORDER_STATUSES, paged } from "@/lib/tenant";
import { brl, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "Todos" },
  { value: "orcamento", label: "Orçamentos" },
  { value: "ordem", label: "Ordens de serviço" },
];

export default function Ordens() {
  const { company } = useTenant();
  const [tab, setTab] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const query = { company_id: company.id };
      if (tab !== "all") query.doc_type = tab;
      if (status !== "all") query.status = status;
      if (search.trim()) query.search_key = { $regex: search.trim().toLowerCase() };
      const rows = await paged("ServiceOrder", query, { sort: "-created_date", limit: 80 });
      if (!alive) return;
      setOrders(rows);
      setLoading(false);
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [company?.id, tab, status, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Ordens de serviço"
        subtitle="Orçamentos e ordens numerados automaticamente para a sua empresa."
        actions={
          <Button asChild className="cta-gradient h-10 gap-2 rounded-xl font-semibold text-white shadow-lg shadow-primary/20">
            <Link to="/ordens/nova"><Plus className="w-4 h-4" /> Nova OS</Link>
          </Button>
        }
      />

      <div className="surface p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="inline-flex rounded-xl border border-border/70 bg-muted/50 p-1">
            {TABS.map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  tab === item.value
                    ? "bg-card text-foreground shadow-[0_2px_8px_-4px_rgba(16,40,32,0.35)] ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente, equipamento ou série..."
              className="pl-9 h-10"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full lg:w-[210px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {ORDER_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-16 grid place-items-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-14 text-center">
              <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
                <FileText className="w-5 h-5" />
              </span>
              <p className="mt-3 font-semibold text-sm">Nenhum documento encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajuste os filtros ou emita uma nova ordem de serviço.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/ordens/nova">Nova ordem</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                    <th className="font-semibold px-4 py-2.5">Documento</th>
                    <th className="font-semibold px-4 py-2.5">Cliente</th>
                    <th className="font-semibold px-4 py-2.5">Equipamento</th>
                    <th className="font-semibold px-4 py-2.5">Status</th>
                    <th className="font-semibold px-4 py-2.5">Data</th>
                    <th className="font-semibold px-4 py-2.5 text-right">Total</th>
                    <th className="px-2" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/ordens/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.number_label}
                        </Link>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                          {order.doc_type === "orcamento" ? "Orçamento" : "OS"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="block truncate">{order.client_name || "—"}</span>
                        <span className="block text-[11px] text-muted-foreground truncate">{order.client_phone}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                        <span className="block truncate">{order.equipment_name || "—"}</span>
                        <span className="block text-[11px] truncate">{order.equipment_serial}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{shortDate(order.created_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">{brl(order.total)}</td>
                      <td className="px-2">
                        <Link to={`/ordens/${order.id}`} className="text-muted-foreground hover:text-primary">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
