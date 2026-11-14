import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Loader2, MonitorSmartphone, Pencil, Trash2, Users, Hash, X, UserRound } from "lucide-react";
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

      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="surface flex items-center gap-3 p-3.5 sm:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <MonitorSmartphone className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Equipamentos</p>
            <p className="mt-0.5 font-heading text-xl sm:text-2xl font-extrabold tabular-nums leading-none">{equipment.length}</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-3.5 sm:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Users className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">Clientes atendidos</p>
            <p className="mt-0.5 font-heading text-xl sm:text-2xl font-extrabold tabular-nums leading-none">{new Set(equipment.map((item) => item.client_id).filter(Boolean)).size}</p>
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="mr-auto">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base">Inventário</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">{filtered.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {term ? "Resultados para sua pesquisa" : "Equipamentos registrados nos seus clientes"}
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar equipamento, série ou cliente..."
                aria-label="Buscar equipamentos"
                className="pl-9 pr-9 h-10 bg-background border-border/70 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 px-5 text-center">
            <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
              <MonitorSmartphone className="w-5 h-5" />
            </span>
            <p className="mt-3 font-semibold text-sm">{term ? "Nenhum resultado encontrado" : "Nenhum equipamento cadastrado"}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {term
                ? "Tente buscar por outro nome, marca, modelo, número de série ou cliente."
                : "Cadastre equipamentos por aqui ou diretamente no formulário de uma ordem de serviço."}
            </p>
            {!term && can.editRecords && (
              <Button className="mt-4 gap-2" size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> Cadastrar equipamento
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 sm:p-4">
            {filtered.map((item) => (
              <article key={item.id} className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
                    <MonitorSmartphone className="h-[19px] w-[19px]" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-semibold text-[14px] leading-5 break-words">{item.name || "Equipamento sem nome"}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground break-words">
                      {[item.brand, item.model].filter(Boolean).join(" / ") || "Marca e modelo não informados"}
                    </p>
                  </div>
                  {(can.editRecords || can.manageTeam) && (
                    <div className="flex shrink-0 items-center gap-0.5 -mr-2 -mt-2 opacity-100 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                      {can.editRecords && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          title="Editar equipamento"
                          aria-label="Editar equipamento"
                          onClick={() => { setEditing(item); setDialogOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {can.manageTeam && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                          title="Excluir equipamento"
                          aria-label="Excluir equipamento"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cliente vinculado</p>
                    <p className="mt-0.5 text-xs font-semibold break-words">{clientMap[item.client_id]?.name || "Não vinculado"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                    <Hash className="h-3 w-3 shrink-0" />
                    <span className="font-medium">Série:</span>
                    <span className="max-w-[190px] break-all font-mono text-foreground">{item.serial || "Não informada"}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} equipment={editing} onSaved={load} />
    </div>
  );
}
