import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paged } from "@/lib/tenant";
import { useTenant } from "@/lib/TenantContext";

const MANUAL = (value) => ({
  equipment_id: "",
  equipment_name: value?.equipment_name || "",
  equipment_brand: value?.equipment_brand || "",
  equipment_model: value?.equipment_model || "",
  equipment_serial: value?.equipment_serial || "",
  equipment_accessories: value?.equipment_accessories || "",
  equipment_condition: value?.equipment_condition || "",
});

export default function EquipmentPicker({ clientId, value, onChange }) {
  const { company } = useTenant();
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    if (!clientId || !company?.id) {
      setEquipment([]);
      return;
    }
    paged("Equipment", { company_id: company.id, client_id: clientId }, { sort: "-created_date", limit: 100 }).then(setEquipment);
  }, [clientId, company?.id]);

  const selectExisting = (id) => {
    if (id === "new") {
      onChange(MANUAL({}));
      return;
    }
    const item = equipment.find((row) => row.id === id);
    if (!item) return;
    onChange({
      equipment_id: item.id,
      equipment_name: item.name || "",
      equipment_brand: item.brand || "",
      equipment_model: item.model || "",
      equipment_serial: item.serial || "",
      equipment_accessories: item.accessories || "",
      equipment_condition: item.condition || "",
    });
  };

  const set = (key, val) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      {clientId && equipment.length > 0 && (
        <div>
          <Label className="field-label">Equipamento cadastrado</Label>
          <Select value={value.equipment_id || "new"} onValueChange={selectExisting}>
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue placeholder="Selecionar equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Cadastrar novo equipamento</SelectItem>
              {equipment.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} {item.brand ? `· ${item.brand}` : ""} {item.serial ? `· ${item.serial}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="eq-name" className="field-label">Equipamento <span className="text-destructive">*</span></Label>
          <Input
            id="eq-name"
            value={value.equipment_name || ""}
            onChange={(e) => set("equipment_name", e.target.value)}
            placeholder="Notebook, impressora, desktop..."
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="eq-brand" className="field-label">Marca</Label>
          <Input id="eq-brand" value={value.equipment_brand || ""} onChange={(e) => set("equipment_brand", e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="eq-model" className="field-label">Modelo</Label>
          <Input id="eq-model" value={value.equipment_model || ""} onChange={(e) => set("equipment_model", e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="eq-serial" className="field-label">Número de série</Label>
          <Input id="eq-serial" value={value.equipment_serial || ""} onChange={(e) => set("equipment_serial", e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="eq-cond" className="field-label">Estado / avarias aparentes</Label>
          <Input id="eq-cond" value={value.equipment_condition || ""} onChange={(e) => set("equipment_condition", e.target.value)} placeholder="Riscos na tampa..." className="mt-1.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eq-acc" className="field-label">Acessórios entregues</Label>
          <Input id="eq-acc" value={value.equipment_accessories || ""} onChange={(e) => set("equipment_accessories", e.target.value)} placeholder="Carregador, capa, mouse..." className="mt-1.5" />
        </div>
      </div>
    </div>
  );
}
