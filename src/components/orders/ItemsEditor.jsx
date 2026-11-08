import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { computeTotals } from "@/lib/tenant";

export default function ItemsEditor({ items = [], onChange }) {
  const update = (index, key, value) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };
  const add = () => onChange([...items, { kind: "service", description: "", qty: 1, unit_price: 0 }]);
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const totals = computeTotals(items);

  return (
    <div>
      <div className="hidden md:grid grid-cols-[110px_1fr_80px_120px_110px_40px] gap-2 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Tipo</span>
        <span>Descrição</span>
        <span>Qtd.</span>
        <span>Valor unit.</span>
        <span className="text-right">Subtotal</span>
        <span />
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground px-1 py-3">
            Nenhum item lançado. Adicione serviços executados e peças utilizadas.
          </p>
        )}
        {items.map((item, index) => {
          const subtotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
          return (
            <div
              key={index}
              className="grid grid-cols-2 md:grid-cols-[110px_1fr_80px_120px_110px_40px] gap-2 items-center rounded-xl border border-border bg-card p-2"
            >
              <Select value={item.kind || "service"} onValueChange={(v) => update(index, "kind", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="part">Peça</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={item.description || ""}
                onChange={(e) => update(index, "description", e.target.value)}
                placeholder="Descrição do item"
                className="h-9 col-span-2 md:col-span-1"
              />

              <Input
                type="number"
                min="0"
                step="1"
                value={item.qty ?? 1}
                onChange={(e) => update(index, "qty", e.target.value)}
                className="h-9"
              />

              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price ?? 0}
                onChange={(e) => update(index, "unit_price", e.target.value)}
                className="h-9"
              />

              <span className="text-right text-sm font-semibold tabular-nums">{brl(subtotal)}</span>

              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={add}>
          <Plus className="w-4 h-4" /> Adicionar item
        </Button>
        <div className="text-xs text-muted-foreground">
          Serviços {brl(totals.services_total)} · Peças {brl(totals.parts_total)}
        </div>
      </div>
    </div>
  );
}
