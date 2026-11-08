import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTenant } from "@/lib/TenantContext";
import { paged } from "@/lib/tenant";
import { formatDoc, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import ClientDialog from "@/components/clients/ClientDialog";

export default function ClientPicker({ value, onChange }) {
  const { company } = useTenant();
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    paged("Client", { company_id: company.id }, { sort: "name", limit: 300 }).then(setClients);
  }, [company?.id]);

  const term = search.trim().toLowerCase();
  const filtered = term
    ? clients.filter((client) =>
        `${client.name} ${client.trade_name} ${client.document} ${client.phone}`.toLowerCase().includes(term)
      )
    : clients;

  const select = (client) => {
    onChange({
      client_id: client.id,
      client_name: client.name,
      client_document: client.document || "",
      client_phone: client.phone || client.whatsapp || "",
      client_email: client.email || "",
      client_address: [client.address, client.address_number, client.district, client.city].filter(Boolean).join(", "),
    });
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between h-11 font-normal">
            <span className="truncate">{value?.client_name || "Selecionar cliente"}</span>
            <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2 border-b border-border">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou telefone..."
              className="h-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">Nenhum cliente encontrado.</p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => select(client)}
                  className="w-full text-left px-2 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{client.name}</span>
                    {value?.client_id === client.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {formatDoc(client.document)} · {formatPhone(client.phone)}
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-primary hover:text-primary"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" /> Cadastrar novo cliente
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(client) => {
          setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
          select(client);
        }}
      />
    </>
  );
}
