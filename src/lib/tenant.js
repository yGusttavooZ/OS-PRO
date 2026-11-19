import {
  addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs,
  limit as firestoreLimit, orderBy, query, runTransaction, serverTimestamp,
  updateDoc, where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const ORDER_STATUSES = [
  "Orçamento", "Aguardando aprovação", "Aprovado", "Aguardando equipamento",
  "Em execução", "Aguardando peça", "Concluído", "Aguardando retirada",
  "Entregue", "Cancelado",
];
export const FINAL_STATUSES = ["Entregue", "Cancelado"];
export const COMPANY_ROLES = [
  { value: "admin", label: "Administrador", hint: "Acesso total à empresa, equipe e financeiro" },
  { value: "technician", label: "Técnico", hint: "OS atribuídas, diagnóstico e atualização de status" },
  { value: "attendant", label: "Atendente", hint: "Clientes, equipamentos, orçamentos e ordens de serviço" },
];
export const DEFAULT_WARRANTY = "A garantia cobre exclusivamente os serviços executados e as peças substituídas nesta ordem de serviço, pelo prazo indicado acima, contado da data de entrega do equipamento. Não estão cobertos danos por mau uso, quedas, oxidação, sobrecarga elétrica, violação por terceiros, vírus e arquivos pessoais. Os dados armazenados no equipamento são de responsabilidade do cliente, sendo recomendado backup prévio. Equipamentos não retirados em até 90 dias após a comunicação de conclusão poderão ser considerados abandonados, conforme o artigo 1.275 do Código Civil.";

export const myCompanyId = (user) => user?.company_id || user?.data?.company_id || null;
export const docLabel = (docType, number) => `${docType === "orcamento" ? "ORC" : "OS"}-${String(number || 0).padStart(4, "0")}`;
export const buildSearchKey = (...parts) => parts.map((p) => String(p || "").toLowerCase().trim()).filter(Boolean).join(" ");
const round = (v) => Math.round((Number(v) || 0) * 100) / 100;

export function computeTotals(items = [], discount = 0, surcharge = 0) {
  let services = 0;
  let parts = 0;
  for (const item of items) {
    const line = (Number(item?.qty) || 0) * (Number(item?.unit_price) || 0);
    if (item?.kind === "part") parts += line;
    else services += line;
  }
  return {
    services_total: round(services),
    parts_total: round(parts),
    total: round(Math.max(0, services + parts - (Number(discount) || 0) + (Number(surcharge) || 0))),
  };
}

const COLLECTIONS = {
  Company: "companies",
  CompanyAccount: "companyAccounts",
  Membership: "memberships",
  ServiceOrder: "serviceOrders",
  Client: "clients",
  Equipment: "equipment",
  Transaction: "transactions",
  OrderEvent: "orderEvents",
  AuditLog: "auditLogs",
  Counter: "counters",
  Plan: "plans",
  PlanRequest: "planRequests",
};

const READ_TTL = 12000;
const readCache = new Map();
const inFlight = new Map();
let cacheUserId = auth.currentUser?.uid || null;

// Nunca reutilize dados lidos por uma conta após a troca de usuário.
onAuthStateChanged(auth, (user) => {
  const nextUserId = user?.uid || null;
  if (nextUserId !== cacheUserId) {
    cacheUserId = nextUserId;
    readCache.clear();
    inFlight.clear();
  }
});

export function invalidateTenantCache(...entityNames) {
  for (const key of [...readCache.keys()]) {
    if (!entityNames.length || entityNames.some((name) => key.includes(`::${name}::`))) readCache.delete(key);
  }
}

function collectionName(entityName) {
  const name = COLLECTIONS[entityName];
  if (!name) throw new Error(`Coleção Firestore não configurada para ${entityName}.`);
  return name;
}

function normalizeSnapshot(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function matchesLocal(value, condition) {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    if (Object.prototype.hasOwnProperty.call(condition, "$regex")) {
      try { return new RegExp(condition.$regex, "i").test(String(value ?? "")); } catch { return false; }
    }
    if (Object.prototype.hasOwnProperty.call(condition, "$gte") && !(value >= condition.$gte)) return false;
    if (Object.prototype.hasOwnProperty.call(condition, "$lte") && !(value <= condition.$lte)) return false;
    if (Object.prototype.hasOwnProperty.call(condition, "$gt") && !(value > condition.$gt)) return false;
    if (Object.prototype.hasOwnProperty.call(condition, "$lt") && !(value < condition.$lt)) return false;
    return true;
  }
  return value === condition;
}

export async function paged(entityName, filters = {}, options = {}) {
  const userId = auth.currentUser?.uid || "anonymous";
  const cacheKey = `${userId}::${entityName}::${JSON.stringify(filters || {})}::${JSON.stringify(options || {})}`;
  const cached = readCache.get(cacheKey);
  if (cached && Date.now() - cached.at < READ_TTL) return cached.data;
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const task = (async () => {
    if (Object.prototype.hasOwnProperty.call(filters || {}, "id")) {
      const { id, ...otherFilters } = filters;
      const snapshot = await getDoc(doc(db, collectionName(entityName), String(id)));
      const rows = snapshot.exists() ? [normalizeSnapshot(snapshot)] : [];
      const matched = rows.filter((row) =>
        Object.entries(otherFilters).every(([field, condition]) => matchesLocal(row[field], condition))
      );
      readCache.set(cacheKey, { at: Date.now(), data: matched });
      return matched;
    }

    const constraints = [];
    const localFilters = [];
    for (const [field, condition] of Object.entries(filters || {})) {
      if (condition && typeof condition === "object" && !Array.isArray(condition)) {
        if (Object.prototype.hasOwnProperty.call(condition, "$regex")) {
          localFilters.push([field, condition]);
          continue;
        }
        for (const [operator, value] of Object.entries(condition)) {
          const op = { $gte: ">=", $lte: "<=", $gt: ">", $lt: "<" }[operator];
          if (!op) continue;
          constraints.push(where(field, op, value));
        }
      } else {
        constraints.push(where(field, "==", condition));
      }
    }

    const sortValue = options?.sort || "";
    const sortField = sortValue.replace(/^-/, "");
    const descending = sortValue.startsWith("-");
    const localSort = Boolean(filters?.technician_uid);
    if (sortField && !localFilters.length && !localSort) constraints.push(orderBy(sortField, descending ? "desc" : "asc"));
    if (Number(options?.limit) > 0 && !localFilters.length && !localSort) constraints.push(firestoreLimit(Number(options.limit)));

    const snapshot = await getDocs(query(collection(db, collectionName(entityName)), ...constraints));
    let rows = snapshot.docs.map(normalizeSnapshot);
    rows = rows.filter((row) => Object.entries(filters || {}).every(([field, condition]) => matchesLocal(row[field], condition)));
    if (sortField && (localFilters.length || localSort)) {
      rows.sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return descending ? -cmp : cmp;
      });
    }
    if (Number(options?.limit) > 0 && (localFilters.length || localSort)) rows = rows.slice(0, Number(options.limit));
    readCache.set(cacheKey, { at: Date.now(), data: rows });
    return rows;
  })().finally(() => inFlight.delete(cacheKey));

  inFlight.set(cacheKey, task);
  return task;
}

export async function createRecord(entityName, payload) {
  const now = new Date().toISOString();
  const record = { ...payload, created_date: payload.created_date || now, updated_date: now, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const ref = await addDoc(collection(db, collectionName(entityName)), record);
  invalidateTenantCache(entityName);
  return { id: ref.id, ...record };
}

/** Cria uma OS e incrementa o consumo mensal na mesma transação. */
async function createMonthlyServiceOrder(payload) {
  const companyId = payload.company_id;
  if (!companyId) throw new Error("Empresa não identificada para validar o limite de OS.");
  const accountRef = doc(db, "companyAccounts", companyId);
  const orderRef = doc(collection(db, "serviceOrders"));
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const timestamp = serverTimestamp();
  const nowIso = now.toISOString();
  const record = {
    ...payload, created_date: payload.created_date || nowIso,
    updated_date: nowIso, created_at: timestamp, updated_at: timestamp,
  };

  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists()) throw new Error("Assinatura da empresa não encontrada.");
    const account = accountSnap.data();
    if (account.status !== "active") {
      throw new Error("A assinatura da empresa não está ativa. Não é possível criar novas OS.");
    }
    const maxOrders = Number(account.max_orders_month) || 0;
    if (maxOrders < 1) throw new Error("O plano atual não permite criar ordens de serviço.");
    const sameMonth = account.orders_month_year === year && account.orders_month_number === month;
    const nextCount = sameMonth ? (Number(account.orders_month_count) || 0) + 1 : 1;
    if (nextCount > maxOrders) {
      throw new Error(`Limite mensal atingido: ${maxOrders} ordens de serviço. O limite será renovado no próximo mês.`);
    }
    transaction.update(accountRef, {
      orders_month_year: year, orders_month_number: month,
      orders_month_count: nextCount, orders_month_updated_at: timestamp,
    });
    transaction.set(orderRef, record);
  });

  invalidateTenantCache("ServiceOrder", "CompanyAccount");
  return { id: orderRef.id, ...record };
}

export async function updateRecord(entityName, id, payload) {
  const data = { ...payload, updated_date: new Date().toISOString(), updated_at: serverTimestamp() };
  await updateDoc(doc(db, collectionName(entityName), id), data);
  invalidateTenantCache(entityName);
  return { id, ...data };
}

/** Confirma a contratação e ativa a assinatura junto com a conclusão da solicitação. */
export async function activatePlanRequest(request) {
  if (!request?.id || !request?.company_id || !request?.plan_id) {
    throw new Error("A solicitação não contém empresa ou plano válido.");
  }

  const requestRef = doc(db, "planRequests", request.id);
  const planRef = doc(db, "plans", request.plan_id);
  const accountRef = doc(db, "companyAccounts", request.company_id);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await runTransaction(db, async (transaction) => {
    const [requestSnap, planSnap, accountSnap] = await Promise.all([
      transaction.get(requestRef),
      transaction.get(planRef),
      transaction.get(accountRef),
    ]);

    if (!requestSnap.exists()) throw new Error("Solicitação não encontrada.");
    if (!planSnap.exists()) throw new Error("O plano solicitado não existe mais.");
    const plan = planSnap.data();
    if (plan.active === false) throw new Error("Este plano está inativo e não pode ser ativado.");
    const currentRequest = requestSnap.data();
    if (currentRequest.company_id !== request.company_id || currentRequest.plan_id !== request.plan_id) {
      throw new Error("Os dados da solicitação foram alterados. Atualize a página.");
    }
    if (["canceled"].includes(currentRequest.status)) {
      throw new Error("Uma solicitação cancelada não pode ativar uma assinatura.");
    }

    transaction.set(accountRef, {
      company_id: request.company_id,
      company_name: currentRequest.company_name || request.company_name || "",
      status: "active",
      plan_id: planSnap.id,
      plan_name: plan.name || currentRequest.plan_name || "",
      price: Number(plan.price_monthly) || 0,
      max_users: Number(plan.max_users) || 0,
      max_orders_month: Number(plan.max_orders_month) || 0,
      // Migração segura: a empresa atual possui somente o administrador inicial.
      reserved_users: Number.isInteger(accountSnap.data()?.reserved_users)
        ? accountSnap.data().reserved_users : 1,
      trial_ends_at: "",
      current_period_end: periodEnd.toISOString(),
      updated_at: serverTimestamp(),
      ...(accountSnap.exists() ? {} : { created_at: serverTimestamp() }),
    }, { merge: true });

    transaction.update(requestRef, {
      status: "done",
      updated_date: now.toISOString(),
      updated_at: serverTimestamp(),
    });
  });

  invalidateTenantCache("CompanyAccount", "PlanRequest");
}

export async function deleteRecord(entityName, id) {
  await deleteDoc(doc(db, collectionName(entityName), id));
  invalidateTenantCache(entityName);
}

export async function deleteRecords(entityName, filters = {}) {
  const rows = await paged(entityName, filters);
  await Promise.all(rows.map((row) => deleteDoc(doc(db, collectionName(entityName), row.id))));
  invalidateTenantCache(entityName);
  return rows.length;
}

export async function countRecords(entityName, filters = {}) {
  const constraints = Object.entries(filters).map(([field, value]) => where(field, "==", value));
  const result = await getCountFromServer(query(collection(db, collectionName(entityName)), ...constraints));
  return result.data().count;
}

/** Reserva atômica do próximo número para evitar duplicidade entre usuários simultâneos. */
export async function nextDocNumber(company) {
  if (!company?.id) throw new Error("Empresa não identificada para gerar o documento.");
  const start = Number(company.doc_start_number) > 0 ? Number(company.doc_start_number) : 1;
  const counterRef = doc(db, "companies", company.id, "counters", "doc");
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    if (!snapshot.exists()) {
      transaction.set(counterRef, { key: "doc", value: start + 1, updated_at: serverTimestamp() });
      return start;
    }
    const current = Number(snapshot.data().value) || start;
    transaction.update(counterRef, { value: current + 1, updated_at: serverTimestamp() });
    return current;
  });
}

export async function logAudit(company, user, action, target, note) {
  try {
    await createRecord("AuditLog", {
      company_id: company?.id || "", company_name: company?.name || "",
      actor_uid: user?.uid || user?.id || "", actor_email: user?.email || "",
      actor_role: user?.company_role || user?.role || "", action,
      target: target || "", note: note || "", at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Não foi possível registrar a auditoria", error);
  }
}

export async function addOrderEvent(company, user, order, fromStatus, toStatus, note) {
  return createRecord("OrderEvent", {
    company_id: company.id, order_id: order.id, order_label: order.number_label,
    from_status: fromStatus || "", to_status: toStatus || "", note: note || "",
    user_name: user?.full_name || user?.email || "", user_email: user?.email || "",
    at: new Date().toISOString(),
  });
}

export function orderPayload({ company, payload, number, docType, status, totals, items }) {
  return {
    company_id: company.id, number, number_label: docLabel(docType, number),
    doc_type: docType, status,
    client_id: payload.client_id || "", client_name: payload.client_name || "",
    client_document: payload.client_document || "", client_phone: payload.client_phone || "",
    client_email: payload.client_email || "", client_address: payload.client_address || "",
    equipment_id: payload.equipment_id || "", equipment_name: payload.equipment_name || "",
    equipment_brand: payload.equipment_brand || "", equipment_model: payload.equipment_model || "",
    equipment_serial: payload.equipment_serial || "", equipment_accessories: payload.equipment_accessories || "",
    equipment_condition: payload.equipment_condition || "", reported_issue: payload.reported_issue || "",
    diagnosis: payload.diagnosis || "", solution: payload.solution || "", items: items || [],
    services_total: totals.services_total, parts_total: totals.parts_total,
    discount: Number(payload.discount) || 0, surcharge: Number(payload.surcharge) || 0,
    total: totals.total, technician: payload.technician || "",
    technician_uid: payload.technician_uid || "", notes: payload.notes || "",
    warranty_terms: payload.warranty_terms || "",
    warranty_terms_source: payload.warranty_terms_source || (
      String(payload.warranty_terms || "").trim() === String(company.warranty_terms || DEFAULT_WARRANTY).trim()
        ? "company_default"
        : "custom"
    ),
    warranty_days: Number(payload.warranty_days) || 90,
    source_quote_id: payload.source_quote_id || "",
    search_key: buildSearchKey(docLabel(docType, number), payload.client_name, payload.client_document, payload.equipment_name, payload.equipment_serial, payload.reported_issue),
  };
}

export async function createDocument({ company, user, payload }) {
  const docType = payload.doc_type === "ordem" ? "ordem" : "orcamento";
  let number;
  try {
    number = await nextDocNumber(company);
  } catch (error) {
    throw new Error(`Falha ao reservar o número do documento: ${error?.message || error}`);
  }
  const items = (payload.items || []).filter((item) => String(item?.description || "").trim());
  const totals = computeTotals(items, payload.discount, payload.surcharge);
  const status = payload.status || (docType === "ordem" ? "Aprovado" : "Orçamento");
  const now = new Date();
  const record = orderPayload({ company, payload, number, docType, status, totals, items });
  record.opened_at = payload.opened_at || now.toISOString();
  record.entry_time = payload.entry_time || now.toTimeString().slice(0, 5);
  let created;
  try {
    created = docType === "ordem"
      ? await createMonthlyServiceOrder(record)
      : await createRecord("ServiceOrder", record);
  } catch (error) {
    throw new Error(`Falha ao gravar a OS e atualizar o limite mensal: ${error?.message || error}`);
  }
  await addOrderEvent(company, user, created, null, status, "Documento criado");
  await logAudit(company, user, "create_order", created.number_label, `${docType} criado`);
  return created;
}

export async function changeOrderStatus({ company, user, order, status, note }) {
  const updated = await updateRecord("ServiceOrder", order.id, {
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
    company, docType: "ordem", number, status: "Aprovado", totals, items: quote.items || [],
    payload: {
      ...quote, source_quote_id: quote.id,
      warranty_terms: quote.warranty_terms || company.warranty_terms || DEFAULT_WARRANTY,
      warranty_days: quote.warranty_days || company.warranty_days || 90,
    },
  });
  record.opened_at = now.toISOString();
  record.entry_time = now.toTimeString().slice(0, 5);
  const created = await createMonthlyServiceOrder(record);
  await updateRecord("ServiceOrder", quote.id, { status: "Aprovado" });
  await addOrderEvent(company, user, quote, quote.status, "Aprovado", `Aprovado e convertido na ${created.number_label}`);
  await addOrderEvent(company, user, created, null, "Aprovado", `Originada do orçamento ${quote.number_label}`);
  await logAudit(company, user, "convert_quote", quote.number_label, `Convertido em ${created.number_label}`);
  return created;
}
