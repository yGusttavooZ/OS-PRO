import { base44 } from "@/api/base44Client";

export const ORDER_STATUSES = [
  "Orçamento",
  "Aguardando aprovação",
  "Aprovado",
  "Aguardando equipamento",
  "Em execução",
  "Aguardando peça",
  "Concluído",
  "Aguardando retirada",
  "Entregue",
  "Cancelado",
];

export const FINAL_STATUSES = ["Entregue", "Cancelado"];

export const COMPANY_ROLES = [
  { value: "admin", label: "Administrador", hint: "Acesso total ao sistema" },
  { value: "technician", label: "Técnico", hint: "Ordens de serviço, diagnósticos e status" },
  { value: "attendant", label: "Atendente", hint: "Clientes, cadastros e orçamentos" },
];

export const DEFAULT_WARRANTY =
  "A garantia cobre exclusivamente os serviços executados e as peças substituídas nesta ordem de serviço, pelo prazo indicado acima, contado da data de entrega do equipamento. Não estão cobertos danos por mau uso, quedas, oxidação, sobrecarga elétrica, violação por terceiros, vírus e arquivos pessoais. Os dados armazenados no equipamento são de responsabilidade do cliente, sendo recomendado backup prévio. Equipamentos não retirados em até 90 dias após a comunicação de conclusão poderão ser considerados abandonados, conforme o artigo 1.275 do Código Civil.";

export const myCompanyId = (user) => user?.company_id || user?.data?.company_id || null;

export const docLabel = (docType, number) =>
  `${docType === "orcamento" ? "ORC" : "OS"}-${String(number || 0).padStart(4, "0")}`;

export const buildSearchKey = (...parts) =>
  parts.map((p) => String(p || "").toLowerCase().trim()).filter(Boolean).join(" ");

const round = (v) => Math.round((Number(v) || 0) * 100) / 100;

export function computeTotals(items = [], discount = 0, surcharge = 0) {
  let services = 0;
  let parts = 0;
  for (const item of items) {
    const line = (Number(item?.qty) || 0) * (Number(item?.unit_price) || 0);
    if (item?.kind === "part") parts += line;
    else services += line;
  }
  const total = Math.max(0, services + parts - (Number(discount) || 0) + (Number(surcharge) || 0));
  return { services_total: round(services), parts_total: round(parts), total: round(total) };
}

/**
 * Cache curto de leituras: evita repetir a mesma consulta quando um componente
 * remonta, ao trocar de aba ou ao navegar entre páginas (limite de requisições da API).
 */
const READ_TTL = 15000;
const readCache = new Map();
const inFlight = new Map();

export function invalidateTenantCache(...entityNames) {
  for (const key of [...readCache.keys()]) {
    if (!entityNames.length || entityNames.some((name) => key.startsWith(`${name}::`))) {
      readCache.delete(key);
    }
  }
}

export async function paged(entityName, query = {}, options) {
  const entity = base44.entities[entityName];
  const key = `${entityName}::${JSON.stringify(query || {})}::${JSON.stringify(options || {})}`;

  const cached = readCache.get(key);
  if (cached && Date.now() - cached.at < READ_TTL) return cached.data;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (options && Object.keys(options).length
    ? entity.filter(query, options)
    : entity.filter(query))
    .then((res) => {
      const data = Array.isArray(res) ? res : res?.items || [];
      readCache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

/** Numeração sequencial por empresa com reserva atômica (compare-and-set). */
export async function nextDocNumber(company) {
  const start = Number(company?.doc_start_number) > 0 ? Number(company.doc_start_number) : 1;
  for (let attempt = 0; attempt < 12; attempt++) {
    const rows = await base44.entities.Counter.filter({ company_id: company.id, key: "doc" });
    const row = Array.isArray(rows) ? rows[0] : rows?.items?.[0];
    if (!row) {
      await base44.entities.Counter.create({ company_id: company.id, key: "doc", value: start + 1 });
      return start;
    }
    const expected = Number(row.value) || start;
    const result = await base44.entities.Counter.updateMany(
      { id: row.id, value: expected },
      { $inc: { value: 1 } }
    );
    if (result?.updated === 1) return expected;
  }
  throw new Error("Não foi possível gerar o número do documento. Tente novamente.");
}

export async function logAudit(company, user, action, target, note) {
  try {
    await base44.entities.AuditLog.create({
      company_id: company?.id || "",
      company_name: company?.name || "",
      actor_email: user?.email || "",
      actor_role: user?.company_role || user?.role || "",
      action,
      target: target || "",
      note: note || "",
      at: new Date().toISOString(),
    });
  } catch {
    /* auditoria não bloqueia a operação */
  }
}

export async function addOrderEvent(company, user, order, fromStatus, toStatus, note) {
  return base44.entities.OrderEvent.create({
    company_id: company.id,
    order_id: order.id,
    order_label: order.number_label,
    from_status: fromStatus || "",
    to_status: toStatus || "",
    note: note || "",
    user_name: user?.full_name || user?.email || "",
    user_email: user?.email || "",
    at: new Date().toISOString(),
  });
}

export function orderPayload({ company, payload, number, docType, status, totals, items }) {
  return {
    company_id: company.id,
    number,
    number_label: docLabel(docType, number),
    doc_type: docType,
    status,
    client_id: payload.client_id || "",
    client_name: payload.client_name || "",
    client_document: payload.client_document || "",
    client_phone: payload.client_phone || "",
    client_email: payload.client_email || "",
    client_address: payload.client_address || "",
    equipment_id: payload.equipment_id || "",
    equipment_name: payload.equipment_name || "",
    equipment_brand: payload.equipment_brand || "",
    equipment_model: payload.equipment_model || "",
    equipment_serial: payload.equipment_serial || "",
    equipment_accessories: payload.equipment_accessories || "",
    equipment_condition: payload.equipment_condition || "",
    reported_issue: payload.reported_issue || "",
    diagnosis: payload.diagnosis || "",
    solution: payload.solution || "",
    items: items || [],
    services_total: totals.services_total,
    parts_total: totals.parts_total,
    discount: Number(payload.discount) || 0,
    surcharge: Number(payload.surcharge) || 0,
    total: totals.total,
    technician: payload.technician || "",
    notes: payload.notes || "",
    warranty_terms: payload.warranty_terms || "",
    warranty_days: Number(payload.warranty_days) || 90,
    source_quote_id: payload.source_quote_id || "",
    search_key: buildSearchKey(
      docLabel(docType, number),
      payload.client_name,
      payload.client_document,
      payload.equipment_name,
      payload.equipment_serial,
      payload.reported_issue
    ),
  };
}

export async function createDocument({ company, user, payload }) {
  const docType = payload.doc_type === "ordem" ? "ordem" : "orcamento";
  const number = await nextDocNumber(company);
  const items = (payload.items || []).filter((item) => String(item?.description || "").trim());
  const totals = computeTotals(items, payload.discount, payload.surcharge);
  const status = payload.status || (docType === "ordem" ? "Aprovado" : "Orçamento");
  const now = new Date();
  const record = orderPayload({ company, payload, number, docType, status, totals, items });
  record.opened_at = payload.opened_at || now.toISOString();
  record.entry_time = payload.entry_time || now.toTimeString().slice(0, 5);
  const created = await base44.entities.ServiceOrder.create(record);
  await addOrderEvent(company, user, created, null, status, "Documento criado");
  await logAudit(company, user, "create_order", created.number_label, `${docType} criado`);
  return created;
}

export async function changeOrderStatus({ company, user, order, status, note }) {
  const updated = await base44.entities.ServiceOrder.update(order.id, {
    status,
    ...(status === "Entregue" ? { exit_at: new Date().toISOString(), exit_time: new Date().toTimeString().slice(0, 5) } : {}),
  });
  await addOrderEvent(company, user, order, order.status, status, note);
  return updated;
}

export async function convertQuote({ company, user, quote }) {
  const number = await nextDocNumber(company);
  const totals = computeTotals(quote.items || [], quote.discount, quote.surcharge);
  const now = new Date();
  const record = orderPayload({
    company,
    docType: "ordem",
    number,
    status: "Aprovado",
    totals,
    items: quote.items || [],
    payload: {
      ...quote,
      source_quote_id: quote.id,
      warranty_terms: quote.warranty_terms || company.warranty_terms || DEFAULT_WARRANTY,
      warranty_days: quote.warranty_days || company.warranty_days || 90,
    },
  });
  record.opened_at = now.toISOString();
  record.entry_time = now.toTimeString().slice(0, 5);
  const created = await base44.entities.ServiceOrder.create(record);
  await base44.entities.ServiceOrder.update(quote.id, { status: "Aprovado" });
  await addOrderEvent(company, user, quote, quote.status, "Aprovado", `Aprovado e convertido na ${created.number_label}`);
  await addOrderEvent(company, user, created, null, "Aprovado", `Originada do orçamento ${quote.number_label}`);
  await logAudit(company, user, "convert_quote", quote.number_label, `Convertido em ${created.number_label}`);
  return created;
}
