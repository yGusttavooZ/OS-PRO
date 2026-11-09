// Mantém apenas os parâmetros legados ainda lidos por telas auxiliares.
// A autenticação e os dados principais do OS-PRO agora usam Firebase.
export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID || "",
  token: null,
  functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || "",
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || "",
};
