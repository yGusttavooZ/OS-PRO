import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Loader2, MonitorSmartphone, Pencil, Trash2, Building2 } from "lucide-react";
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

      <div className="surface p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por equipamento, marca, modelo ou cliente..."
            className="pl-9 h-10"
          />
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-16 grid place-items-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
                <MonitorSmartphone className="w-5 h-5" />
              </span>
              <p className="mt-3 font-semibold text-sm">
                {term ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {term
                  ? "Tente buscar por outro nome, marca, modelo, série ou cliente."
                  : "Cadastre equipamentos para manter o histórico dos aparelhos atendidos."}
              </p>
              {!term && can.editRecords && (
                <Button size="sm" className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  Cadastrar equipamento
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[900px] table-fixed">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                    <th className="w-[25%] font-semibold px-4 py-2.5">Equipamento</th>
                    <th className="w-[22%] font-semibold px-4 py-2.5">Cliente</th>
                    <th className="w-[22%] font-semibold px-4 py-2.5">Marca / modelo</th>
                    <th className="w-[23%] font-semibold px-4 py-2.5">Nº de série</th>
                    <th className="w-[8%] px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold">{item.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {clientMap[item.client_id]?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[item.brand, item.model].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.serial || "—"}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {can.editRecords && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Editar equipamento"
                              onClick={() => {
                                setEditing(item);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {can.manageTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label="Excluir equipamento"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="w-3.5 h-3.5" /> Equipamentos visíveis apenas para a equipe de {company?.name}.
      </div>

      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} equipment={editing} onSaved={load} />
    </div>
  );
}
