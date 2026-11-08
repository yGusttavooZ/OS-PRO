import { cn } from "@/lib/utils";

export const ORDER_STATUSES = [
  "Orçamento",
  "Aguardando aprovação",
  "Aprovado",
  "Aguardando equipamento",
  "Em execução",
  "Aguardando peça",
  "Concluído",
  "Aguardando retirada",
  "Entregue",
  "Cancelado",
];

const STATUS_STYLES = {
  "Orçamento": "bg-slate-500/[0.09] text-slate-600 ring-slate-500/15",
  "Aguardando aprovação": "bg-amber-500/[0.1] text-amber-700 ring-amber-500/15",
  "Aprovado": "bg-sky-500/[0.1] text-sky-700 ring-sky-500/15",
  "Aguardando equipamento": "bg-orange-500/[0.1] text-orange-700 ring-orange-500/15",
  "Em execução": "bg-indigo-500/[0.1] text-indigo-700 ring-indigo-500/15",
  "Aguardando peça": "bg-purple-500/[0.1] text-purple-700 ring-purple-500/15",
  "Concluído": "bg-emerald-500/[0.1] text-emerald-700 ring-emerald-500/15",
  "Aguardando retirada": "bg-teal-500/[0.1] text-teal-700 ring-teal-500/15",
  "Entregue": "bg-primary/[0.09] text-primary ring-primary/15",
  "Cancelado": "bg-rose-500/[0.1] text-rose-700 ring-rose-500/15",
};

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-semibold ring-1 ring-inset",
        STATUS_STYLES[status] || "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
