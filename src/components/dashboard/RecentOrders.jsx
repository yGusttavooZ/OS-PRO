import { Link } from "react-router-dom";
import { ArrowUpRight, FileText } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { brl, shortDate } from "@/lib/format";

export default function RecentOrders({ orders = [] }) {
  return (
    <div className="surface mt-3 sm:mt-4 overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-4">
        <div>
          <h2 className="font-heading font-bold text-[15px]">Últimas ordens de serviço</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Movimentações recentes da bancada</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary">
          <Link to="/ordens">Ver todas <ArrowUpRight className="w-3.5 h-3.5" /></Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 pb-6 text-center">
          <span className="w-11 h-11 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
            <FileText className="w-5 h-5" />
          </span>
          <p className="mt-3 text-sm font-semibold">Nenhuma ordem cadastrada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Cadastre um cliente e emita sua primeira OS.</p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/ordens/nova">Nova ordem de serviço</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                <th className="font-semibold px-5 py-2.5">Documento</th>
                <th className="font-semibold px-5 py-2.5">Cliente</th>
                <th className="font-semibold px-5 py-2.5 hidden md:table-cell">Equipamento</th>
                <th className="font-semibold px-5 py-2.5">Status</th>
                <th className="font-semibold px-5 py-2.5 hidden sm:table-cell">Data</th>
                <th className="font-semibold px-5 py-2.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Link to={`/ordens/${order.id}`} className="font-semibold text-primary hover:underline">
                      {order.number_label}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{order.client_name || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {order.equipment_name || "—"}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                    {shortDate(order.created_date)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                    {brl(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
