import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Loader2, MonitorSmartphone, Pencil, Trash2, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EquipmentDialog from "@/components/equipment/EquipmentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { invalidateTenantCache, paged } from "@/lib/tenant";

export default function Equipamentos() {
  const { company, can } = useTenant();
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const [equipmentRows, clientRows] = await Promise.all([
      paged("Equipment", { company_id: company.id }, { sort: "-created_date", limit: 200 }),
      paged("Client", { company_id: company.id }, { limit: 300 }),
    ]);
    setEquipment(equipmentRows);
    setClients(clientRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [company?.id]);

  const clientMap = useMemo(() => {
    const map = {};
    for (const client of clients) map[client.id] = client;
    return map;
  }, [clients]);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? equipment.filter((item) =>
        `${item.name} ${item.brand} ${item.model} ${item.serial} ${clientMap[item.client_id]?.name || ""}`
          .toLowerCase()
          .includes(term)
      )
    : equipment;

  const handleDelete = async (item) => {
    const linked = await base44.entities.ServiceOrder.count({ company_id: company.id, equipment_id: item.id });
    if (linked > 0) return;
    await base44.entities.Equipment.delete(item.id);
    invalidateTenantCache("Equipment");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        subtitle="Equipamentos vinculados aos clientes, com marca, modelo e número de série."
        actions={
          can.editRecords ? (
            <Button
              className="h-10 gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Novo equipamento
            </Button>
          ) : null
        }
      />

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MonitorSmartphone className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-base font-bold">Inventário de equipamentos</h2>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{equipment.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Consulte e gerencie os equipamentos cadastrados para seus clientes.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
              <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground">Clientes</p>
                <p className="text-sm font-bold tabular-nums">{new Set(equipment.map((item) => item.client_id).filter(Boolean)).size}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground">Exibindo</p>
                <p className="text-sm font-bold tabular-nums">{filtered.length}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por equipamento, marca, série ou cliente..." aria-label="Buscar equipamentos" className="h-10 bg-background pl-9 pr-9" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <p className="text-xs text-muted-foreground sm:ml-auto">
              {filtered.length === 1 ? "1 equipamento encontrado" : `${filtered.length} equipamentos encontrados`}
              {term ? " para esta busca" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-56 place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><MonitorSmartphone className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-semibold">{term ? "Nenhum resultado encontrado" : "Seu inventário está vazio"}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {term ? "Não encontramos equipamentos com esses termos. Experimente buscar por outro nome, marca, modelo ou cliente." : "Os equipamentos cadastrados nos clientes e nas ordens de serviço aparecerão nesta área."}
            </p>
            {!term && can.editRecords && <Button className="mt-4 gap-2" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Adicionar equipamento</Button>}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35 text-left">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Equipamento</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marca / modelo</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Número de série</th>
                    {(can.editRecords || can.manageTeam) && <th className="w-24 px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/25">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><MonitorSmartphone className="h-4 w-4" /></span>
                          <span className="min-w-0">
                            <span className="block break-words font-semibold text-[13px]">{item.name || "Equipamento sem nome"}</span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">Cadastro de equipamento</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="block max-w-[180px] break-words text-[13px] font-medium">{clientMap[item.client_id]?.name || "Não vinculado"}</span></td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(" · ") || "Não informado"}</td>
                      <td className="px-4 py-3.5"><span className="font-mono text-xs text-muted-foreground">{item.serial || "—"}</span></td>
                      {(can.editRecords || can.manageTeam) && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {can.editRecords && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Editar equipamento" aria-label="Editar equipamento" onClick={() => { setEditing(item); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}
                            {can.manageTeam && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" title="Excluir equipamento" aria-label="Excluir equipamento" onClick={() => handleDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border/70 md:hidden">
              {filtered.map((item) => (
                <article key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MonitorSmartphone className="h-[18px] w-[18px]" /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold">{item.name || "Equipamento sem nome"}</h3>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(" · ") || "Marca e modelo não informados"}</p>
                    </div>
                    {(can.editRecords || can.manageTeam) && (
                      <div className="-mr-2 -mt-2 flex shrink-0 items-center">
                        {can.editRecords && <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar equipamento" aria-label="Editar equipamento" onClick={() => { setEditing(item); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}
                        {can.manageTeam && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Excluir equipamento" aria-label="Excluir equipamento" onClick={() => handleDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/35 p-3">
                    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p><p className="mt-1 break-words text-xs font-medium">{clientMap[item.client_id]?.name || "Não vinculado"}</p></div>
                    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nº de série</p><p className="mt-1 break-all font-mono text-xs">{item.serial || "—"}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} equipment={editing} onSaved={load} />
    </div>
  );
}
