/**
 * Modelo central de assinaturas do OS PRO.
 *
 * Preparação para integração futura com um provedor de pagamentos.
 * Este módulo não cria cobranças, não confirma pagamentos e não acessa
 * credenciais externas. A ativação continua dependendo do fluxo atual.
 */

export const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIAL: "trial",
  AWAITING_PAYMENT: "awaiting_payment",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  SUSPENDED: "suspended",
  CANCELED: "canceled",
});

export const SUBSCRIPTION_STATUS_LABELS = Object.freeze({
  [SUBSCRIPTION_STATUSES.TRIAL]: "Em teste",
  [SUBSCRIPTION_STATUSES.AWAITING_PAYMENT]: "Aguardando pagamento",
  [SUBSCRIPTION_STATUSES.ACTIVE]: "Ativa",
  [SUBSCRIPTION_STATUSES.PAST_DUE]: "Pagamento atrasado",
  [SUBSCRIPTION_STATUSES.SUSPENDED]: "Suspensa",
  [SUBSCRIPTION_STATUSES.CANCELED]: "Cancelada",
});

export const SUBSCRIPTION_STATUS_VALUES = Object.freeze(
  Object.values(SUBSCRIPTION_STATUSES)
);

/**
 * Normaliza estados legados sem alterar os registros existentes.
 * Estados desconhecidos são preservados para facilitar diagnóstico.
 */
export function normalizeSubscriptionStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  const aliases = {
    pending: SUBSCRIPTION_STATUSES.AWAITING_PAYMENT,
    awaiting: SUBSCRIPTION_STATUSES.AWAITING_PAYMENT,
    paid: SUBSCRIPTION_STATUSES.ACTIVE,
    overdue: SUBSCRIPTION_STATUSES.PAST_DUE,
    canceled: SUBSCRIPTION_STATUSES.CANCELED,
    cancelled: SUBSCRIPTION_STATUSES.CANCELED,
  };

  if (SUBSCRIPTION_STATUS_VALUES.includes(value)) return value;
  return aliases[value] || value || "unknown";
}

/**
 * Formato padronizado para um futuro histórico de assinatura.
 * O chamador deve fornecer o timestamp; a persistência será integrada
 * depois que as regras de acesso do Firestore forem revisadas.
 */
export function buildSubscriptionEvent({
  type,
  status,
  description = "",
  source = "platform",
  actorUid = null,
  occurredAt = new Date().toISOString(),
  metadata = {},
} = {}) {
  if (!type || !String(type).trim()) {
    throw new Error("O evento da assinatura precisa de um tipo.");
  }

  return {
    type: String(type).trim(),
    status: normalizeSubscriptionStatus(status),
    description: String(description || "").trim(),
    source: String(source || "platform"),
    actor_uid: actorUid || null,
    occurred_at: occurredAt,
    metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {},
  };
}
