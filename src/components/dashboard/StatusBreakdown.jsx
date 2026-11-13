import { Link } from "react-router-dom";
import { Users, ArrowUpRight } from "lucide-react";
import { num } from "@/lib/format";

export default function StatusBreakdown({ rows = [], clients = 0 }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="surface p-5">
      <h2 className="font-heading font-bold text-[15px]">Situação das ordens</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-5">Distribuição atual da operação</p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ordem em andamento.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground/80">{row.label}</span>
                <span className="font-bold tabular-nums">{row.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <Link to="/clientes" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
          <Users className="w-4 h-4" /> Clientes cadastrados <ArrowUpRight className="w-3 h-3" />
        </Link>
        <span className="font-heading font-bold text-lg">{num(clients)}</span>
      </div>
    </div>
  );
}
