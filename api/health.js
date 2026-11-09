import { adminDb } from "./_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    await adminDb.collection("_system").doc("health").get();
    return res.status(200).json({ ok: true, service: "os-pro-api" });
  } catch (error) {
    console.error("Falha no health check da API:", error);
    return res.status(503).json({ ok: false, error: "Serviço temporariamente indisponível." });
  }
}
