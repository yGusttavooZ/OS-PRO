import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClientPicker from "@/components/orders/ClientPicker";
import EquipmentPicker from "@/components/orders/EquipmentPicker";
import ItemsEditor from "@/components/orders/ItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useTenant } from "@/lib/TenantContext";
import {
  DEFAULT_WARRANTY, ORDER_STATUSES, buildSearchKey, computeTotals, createDocument, docLabel, paged,
} from "@/lib/tenant";
import { brl } from "@/lib/format";

const EMPTY = {
  doc_type: "ordem",
  status: "Aprovado",
  client_id: "", client_name: "", client_document: "", client_phone: "", client_email: "", client_address: "",
  equipment_id: "", equipment_name: "", equipment_brand: "", equipment_model: "",
  equipment_serial: "", equipment_accessories: "", equipment_condition: "",
  reported_issue: "", diagnosis: "", solution: "", technician: "", notes: "",
  discount: 0, surcharge: 0, warranty_days: 90, warranty_terms: DEFAULT_WARRANTY,
};

export default function OrdemForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { company, user, can } = useTenant();

  const [form, setForm] = useState(EMPTY);
  const [items, setItems] = useState([{ kind: "service", description: "", qty: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!company) return;
    setForm((prev) => ({
      ...prev,
      warranty_terms: prev.warranty_terms || company.warranty_terms || DEFAULT_WARRANTY,
      warranty_days: Number(company.warranty_days) || 90,
      technician: prev.technician || user?.full_name || "",
    }));
  }, [company?.id]);

  useEffect(() => {
    if (!editing || !company?.id) return;
    (async () => {
      const rows = await paged("ServiceOrder", { id }, { limit: 1 });
      const order = rows[0];
      if (!order) {
        navigate("/ordens", { replace: true });
        return;
      }
      setForm({ ...EMPTY, ...order });
      setItems(Array.isArray(order.items) && order.items.length ? order.items : []);
      setLoading(false);
    })();
  }, [editing, id, company?.id, navigate]);

  if (!can.editRecords) return <Navigate to="/ordens" replace />;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const totals = computeTotals(items, form.discount, form.surcharge);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.client_id) {
      setError("Selecione o cliente da ordem.");
      return;
    }
    if (!String(form.equipment_name || "").trim()) {
      setError("Informe o equipamento que será atendido.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let equipmentId = form.equipment_id;
      if (!equipmentId) {
        const equipment = await base44.entities.Equipment.create({
          company_id: company.id,
          client_id: form.client_id,
          name: form.equipment_name,
          brand: form.equipment_brand,
          model: form.equipment_model,
          serial: form.equipment_serial,
          accessories: form.equipment_accessories,
          condition: form.equipment_condition,
        });
        equipmentId = equipment.id;
      }

      const payload = {
        ...form,
        equipment_id: equipmentId,
        items,
        discount: Number(form.discount) || 0,
        surcharge: Number(form.surcharge) || 0,
        warranty_days: Number(form.warranty_days) || 90,
      };

      if (editing) {
        const updatedTotals = computeTotals(items, payload.discount, payload.surcharge);
        await base44.entities.ServiceOrder.update(id, {
          ...payload,
          items: items.filter((item) => String(item.description || "").trim()),
          ...updatedTotals,
          search_key: buildSearchKey(
            form.number_label || docLabel(form.doc_type, form.number),
            form.client_name,
            form.client_document,
            form.equipment_name,
            form.equipment_serial,
            form.reported_issue
          ),
        });
        navigate(`/ordens/${id}`);
      } else {
        const created = await createDocument({ company, user, payload });
        navigate(`/ordens/${created.id}`);
      }
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o documento.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 grid place-items-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={editing ? `Editar ${form.number_label || "documento"}` : "Nova ordem de serviço"}
        subtitle="Preencha os dados do cliente, do equipamento e os itens do atendimento."
        actions={
          <>
            <Button type="button" variant="ghost" className="h-10 gap-1.5" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button type="submit" disabled={saving} className="h-10 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] mb-4">Cliente e equipamento</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="field-label">Cliente <span className="text-destructive">*</span></Label>
                <div className="mt-1.5">
                  <ClientPicker
                    value={form}
                    onChange={(client) => setForm((prev) => ({ ...prev, ...client }))}
                  />
                </div>
                {form.client_phone && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{form.client_phone}</p>
                )}
              </div>
              <div>
                <Label className="field-label">Tipo de documento</Label>
                <Select value={form.doc_type} onValueChange={(v) => set("doc_type", v)}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordem">Ordem de serviço</SelectItem>
                    <SelectItem value="orcamento">Orçamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <EquipmentPicker
                clientId={form.client_id}
                value={form}
                onChange={(equipment) => setForm((prev) => ({ ...prev, ...equipment }))}
              />
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] mb-4">Descrição técnica</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="issue" className="field-label">Defeito relatado pelo cliente</Label>
                <Textarea id="issue" value={form.reported_issue || ""} onChange={(e) => set("reported_issue", e.target.value)} placeholder="O que o cliente relatou ao entregar o equipamento" className="mt-1.5 min-h-[70px]" />
              </div>
              <div>
                <Label htmlFor="diagnosis" className="field-label">Diagnóstico técnico</Label>
                <Textarea id="diagnosis" value={form.diagnosis || ""} onChange={(e) => set("diagnosis", e.target.value)} placeholder="Análise realizada pelo técnico" className="mt-1.5 min-h-[70px]" />
              </div>
              <div>
                <Label htmlFor="solution" className="field-label">Solução aplicada</Label>
                <Textarea id="solution" value={form.solution || ""} onChange={(e) => set("solution", e.target.value)} placeholder="Procedimento executado" className="mt-1.5 min-h-[70px]" />
              </div>
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] mb-4">Serviços e peças</h2>
            <ItemsEditor items={items} onChange={setItems} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="font-heading font-bold text-[15px] mb-4">Valores</h2>
            <div className="space-y-3">
              <div className="data-row">
                <span className="text-sm text-muted-foreground">Serviços</span>
                <span className="text-sm font-semibold tabular-nums">{brl(totals.services_total)}</span>
              </div>
              <div className="data-row">
                <span className="text-sm text-muted-foreground">Peças</span>
                <span className="text-sm font-semibold tabular-nums">{brl(totals.parts_total)}</span>
              </div>
              <div>
                <Label htmlFor="discount" className="field-label">Desconto (R$)</Label>
                <Input id="discount" type="number" min="0" step="0.01" value={form.discount} onChange={(e) => set("discount", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="surcharge" className="field-label">Acréscimo (R$)</Label>
                <Input id="surcharge" type="number" min="0" step="0.01" value={form.surcharge} onChange={(e) => set("surcharge", e.target.value)} className="mt-1.5" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-heading text-xl font-extrabold text-primary tabular-nums">{brl(totals.total)}</span>
              </div>
            </div>
          </section>

          <section className="surface p-5 space-y-4">
            <h2 className="font-heading font-bold text-[15px]">Atendimento</h2>
            {!editing && (
              <div>
                <Label className="field-label">Status inicial</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="technician" className="field-label">Técnico responsável</Label>
              <Input id="technician" value={form.technician || ""} onChange={(e) => set("technician", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="warranty" className="field-label">Garantia (dias)</Label>
              <Input id="warranty" type="number" min="0" value={form.warranty_days} onChange={(e) => set("warranty_days", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="notes" className="field-label">Observações internas</Label>
              <Textarea id="notes" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 min-h-[70px]" />
            </div>
          </section>

          {error && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
