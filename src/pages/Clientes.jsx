import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Users, Pencil, Trash2, ChevronRight, Building2, UserRound, Phone, Mail, MapPin } from "lucide-react";
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

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-heading text-sm font-bold">Base de clientes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Consulte e gerencie os cadastros da sua assistência</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground sm:self-auto">
            <Users className="h-3.5 w-3.5" />
            <span><strong className="font-semibold text-foreground">{clients.length}</strong> exibidos</span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, documento ou telefone..."
              className="h-11 rounded-xl border-border/80 bg-background pl-10"
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
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-muted/40">
                    <th className="font-semibold px-4 py-2.5">Cliente</th>
                    <th className="font-semibold px-4 py-2.5">Documento</th>
                    <th className="font-semibold px-4 py-2.5">Contato</th>
                    <th className="font-semibold px-4 py-2.5">Cidade</th>
                    <th className="font-semibold px-4 py-2.5">Desde</th>
                    <th className="px-2" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            {client.document?.replace(/\D/g, "").length > 11 ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <Link to={`/clientes/${client.id}`} className="font-semibold text-foreground transition-colors hover:text-primary">
                              {client.name}
                            </Link>
                            {client.trade_name && (
                              <span className="block truncate text-[11px] text-muted-foreground">{client.trade_name}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDoc(client.document)}</td>
                      <td className="px-4 py-3">
                        <span className="block">{formatPhone(client.phone)}</span>
                        <span className="block text-[11px] text-muted-foreground truncate max-w-[180px]">{client.email}</span>
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

            <div className="grid gap-2 md:hidden">
              {clients.map((client) => (
                <div key={client.id} className="rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/clientes/${client.id}`} className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        {client.document?.replace(/\D/g, "").length > 11 ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-foreground">{client.name}</strong>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{formatDoc(client.document) || "Sem documento"}</span>
                      </span>
                    </Link>
                    <Link to={`/clientes/${client.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="Ver cliente">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    {client.phone && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{formatPhone(client.phone)}</span>}
                    {client.email && <span className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{client.email}</span></span>}
                    {client.city && <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{client.city}</span>}
                  </div>
                  {(can.editRecords || can.manageTeam) && (
                    <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                      {can.editRecords && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs" onClick={() => { setEditing(client); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                      )}
                      {can.manageTeam && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive" onClick={() => handleDelete(client)}>
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
          </div>
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
