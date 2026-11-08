export const brl = (value) =>
  (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (value) => (Number(value) || 0).toLocaleString("pt-BR");

export const shortDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

export const dateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const formatDoc = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value || "—";
};

export const formatPhone = (value) => {
  const d = String(value || "").replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value || "—";
};

export const monthLabel = (date) =>
  new Date(date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");

export const periodRange = (period) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
    };
  }
  if (period === "90d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 89);
    return { from: from.toISOString(), to: end.toISOString() };
  }
  if (period === "year") {
    return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: end.toISOString() };
  }
  return { from: start.toISOString(), to: end.toISOString() };
};
