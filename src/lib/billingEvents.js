/**
 * Normalização local de eventos de cobrança para testes do OS PRO.
 *
 * Este módulo é apenas estrutural: não recebe webhooks, não consulta
 * provedores, não confirma pagamentos e não altera assinaturas.
 * Eventos gerados aqui são sempre marcados como demonstração.
 */

export const BILLING_EVENT_TYPES = Object.freeze({
  PENDING: "payment_pending",
  APPROVED: "payment_approved",
  REJECTED: "payment_rejected",
  CANCELED: "payment_canceled",
  REFUNDED: "payment_refunded",
});

export const BILLING_EVENT_TYPE_VALUES = Object.freeze(
  Object.values(BILLING_EVENT_TYPES)
);

/**
 * Chave determinística para reconhecer o mesmo evento em testes.
 * Não substitui a validação de assinatura/autenticidade de um provedor.
 */
export function buildBillingEventKey(provider, externalEventId) {
  const providerName = String(provider || "").trim().toLowerCase();
  const eventId = String(externalEventId || "").trim();

  if (!providerName || !eventId) {
    throw new Error("Informe o provedor e o identificador externo do evento.");
  }

  return `${providerName}:${eventId}`;
}

/**
 * Cria um registro demonstrativo com campos permitidos.
 * A propriedade provider_verified é sempre false e não pode ser
 * sobrescrita pelos dados recebidos.
 */
export function buildDemoBillingEvent(input = {}) {
  const provider = String(input.provider || "demo").trim().toLowerCase();
  const externalEventId = String(input.externalEventId || "").trim();
  const type = String(input.type || "").trim().toLowerCase();
  const companyId = String(input.companyId || "").trim();
  const amount = input.amount == null ? null : Number(input.amount);
  const currency = String(input.currency || "BRL").trim().toUpperCase();

  if (!externalEventId) {
    throw new Error("O evento precisa de um identificador externo.");
  }

  if (!BILLING_EVENT_TYPE_VALUES.includes(type)) {
    throw new Error("Tipo de evento de cobrança inválido.");
  }

  if (!companyId) {
    throw new Error("O evento precisa estar associado a uma empresa.");
  }

  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new Error("O valor do evento precisa ser um número válido e não negativo.");
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("A moeda precisa usar um código de três letras.");
  }

  return {
    event_key: buildBillingEventKey(provider, externalEventId),
    provider,
    external_event_id: externalEventId,
    company_id: companyId,
    type,
    amount,
    currency,
    source: "demo",
    provider_verified: false,
    subscription_changed: false,
  };
}
