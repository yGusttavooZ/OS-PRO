import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Loader2, MonitorSmartphone, Pencil, Trash2, Users } from "lucide-react";
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

      <section className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Total de equipamentos</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted/70 text-muted-foreground">
              <MonitorSmartphone className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold tabular-nums">{equipment.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Cadastrados na empresa</p>
        </div>
        <div className="surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Clientes vinculados</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted/70 text-muted-foreground">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-extrabold tabular-nums">{new Set(equipment.map((item) => item.client_id).filter(Boolean)).size}</p>
          <p className="mt-1 text-xs text-muted-foreground">Com pelo menos um equipamento</p>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="mr-auto">
              <h2 className="font-heading font-bold text-base">Seus equipamentos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "equipamento encontrado" : "equipamentos encontrados"}
                {term ? " na busca" : " cadastrados"}
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar equipamento, série ou cliente..."
                aria-label="Buscar equipamentos"
                className="pl-9 h-10 bg-background"
              />
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
              <article key={item.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MonitorSmartphone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-5 break-words">{item.name || "Equipamento sem nome"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground break-words">
                      {[item.brand, item.model].filter(Boolean).join(" · ") || "Marca e modelo não informados"}
                    </p>
                  </div>
                  {(can.editRecords || can.manageTeam) && (
                    <div className="flex shrink-0 items-center gap-1 -mr-2 -mt-2">
                      {can.editRecords && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/70 pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cliente</p>
                    <p className="mt-1 text-sm font-medium break-words">{clientMap[item.client_id]?.name || "Não vinculado"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Número de série</p>
                    <p className="mt-1 text-sm font-medium break-all">{item.serial || "Não informado"}</p>
                  </div>
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
