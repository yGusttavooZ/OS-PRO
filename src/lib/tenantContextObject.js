import { createContext } from "react";

// Contexto isolado em um modulo proprio: assim o provider e o hook sempre
// compartilham a mesma instancia, mesmo quando outro arquivo e atualizado em tempo real.
export const TenantContext = createContext(null);
