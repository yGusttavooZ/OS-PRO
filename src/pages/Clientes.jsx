import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Users, Pencil, Trash2, ChevronRight, Building2, Phone, Mail } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClientDialog from "@/components/clients/ClientDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import { invalidateTenantCache, paged } from "@/lib/tenant";
import { formatDoc, formatPhone, shortDate } from "@/lib/format";

export default function Clientes() {
  const { company, can } = useTenant();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const query = { company_id: company.id };
    if (search.trim()) query.search_key = { $regex: search.trim().toLowerCase() };
    const rows = await paged("Client", query, { sort: "name", limit: 100 });
    setClients(rows);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [company?.id, search]);

  const handleDelete = async (client) => {
    setMessage("");
    const orders = await base44.entities.ServiceOrder.count({ company_id: company.id, client_id: client.id });
    if (orders > 0) {
      setMessage(
        `"${client.name}" possui ${orders} ordem(ns) vinculada(s) e não pode ser excluído. Edite o cadastro e mantenha o histórico.`
      );
      return;
    }
    await base44.entities.Equipment.deleteMany({ company_id: company.id, client_id: client.id });
    await base44.entities.Client.delete(client.id);
    invalidateTenantCache("Client", "Equipment");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro completo com contatos, endereço e histórico de atendimentos."
        actions={
          can.editRecords ? (
            <Button
              className="h-10 gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Novo cliente
            </Button>
          ) : null
        }
      />

      {message && (
        <div className="mb-4 rounded-xl border border-accent bg-accent/60 px-4 py-2.5 text-xs text-accent-foreground">
          {message}
        </div>
      )}

      <div className="surface p-4 sm:p-5">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, documento ou telefone..."
            className="pl-9 h-10"
          />
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-16 grid place-items-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-14 text-center">
              <span className="w-12 h-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
                <Users className="w-5 h-5" />
              </span>
              <p className="mt-3 font-semibold text-sm">Nenhum cliente cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">Cadastre o primeiro cliente para emitir uma OS.</p>
              {can.editRecords && (
                <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
                  Cadastrar cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[900px] table-fixed">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                    <th className="w-[24%] font-semibold px-4 py-2.5">Cliente</th>
                    <th className="w-[17%] font-semibold px-4 py-2.5">Documento</th>
                    <th className="w-[29%] font-semibold px-4 py-2.5">Contato</th>
                    <th className="w-[13%] font-semibold px-4 py-2.5">Cidade</th>
                    <th className="w-[12%] font-semibold px-4 py-2.5">Desde</th>
                    <th className="w-[5%] px-2" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/clientes/${client.id}`} className="font-semibold text-primary hover:underline">
                          {client.name}
                        </Link>
                        {client.trade_name && (
                          <span className="block text-[11px] text-muted-foreground">{client.trade_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDoc(client.document)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {client.phone && (
                            <span className="flex items-center gap-2 whitespace-nowrap text-sm">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {formatPhone(client.phone)}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </span>
                          )}
                          {!client.phone && !client.email && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{client.city || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{shortDate(client.created_date)}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {can.editRecords && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditing(client);
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
                              onClick={() => handleDelete(client)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Link to={`/clientes/${client.id}`} className="text-muted-foreground hover:text-primary p-1">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
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
        <Building2 className="w-3.5 h-3.5" /> Cadastros visíveis apenas para a equipe de {company?.name}.
      </div>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
        onSaved={load}
      />
    </div>
  );
}
