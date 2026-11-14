import { FieldValue } from "firebase-admin/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const ownerEmail = String(process.env.PLATFORM_OWNER_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail) {
    return res.status(503).json({ error: "A configuração inicial do proprietário ainda não foi habilitada." });
  }

  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Faça login para continuar." });

  try {
    const { adminAuth, adminDb } = await import("../server/firebaseAdmin.js");
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email_verified || String(decoded.email || "").trim().toLowerCase() !== ownerEmail) {
      return res.status(403).json({ error: "Esta conta não está autorizada a ser proprietária da plataforma." });
    }

    const authUser = await adminAuth.getUser(decoded.uid);
    if (!authUser.emailVerified || String(authUser.email || "").trim().toLowerCase() !== ownerEmail) {
      return res.status(403).json({ error: "Confirme o e-mail autorizado para continuar." });
    }

    const systemRef = adminDb.collection("_system").doc("platform");
    const userRef = adminDb.collection("users").doc(decoded.uid);
    await adminDb.runTransaction(async (transaction) => {
      const [systemSnap, userSnap, existingOwners] = await Promise.all([
        transaction.get(systemRef),
        transaction.get(userRef),
        transaction.get(adminDb.collection("users").where("platform_role", "==", "platform_admin").limit(1)),
      ]);

      const registeredOwnerUid = systemSnap.exists ? systemSnap.data().owner_uid : "";
      const existingOwnerUid = existingOwners.empty ? "" : existingOwners.docs[0].id;
      const lockedOwnerUid = registeredOwnerUid || existingOwnerUid;
      if (lockedOwnerUid && lockedOwnerUid !== decoded.uid) {
        const error = new Error("O proprietário inicial já foi configurado. Não é possível criar outro por este processo.");
        error.statusCode = 409;
        throw error;
      }

      const profile = {
        uid: decoded.uid,
        email: authUser.email,
        full_name: authUser.displayName || "",
        platform_role: "platform_admin",
        created_at: userSnap.exists && userSnap.data().created_at
          ? userSnap.data().created_at
          : FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      };

      // Substitui o perfil anterior: o proprietário não fica vinculado a uma empresa.
      transaction.set(userRef, profile);
      transaction.set(systemRef, {
        owner_uid: decoded.uid,
        owner_email: authUser.email,
        initialized_at: systemSnap.exists && systemSnap.data().initialized_at
          ? systemSnap.data().initialized_at
          : FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ ok: true, role: "platform_admin" });
  } catch (error) {
    console.error("Falha ao configurar proprietário:", error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Não foi possível configurar o proprietário. Verifique a configuração do Firebase Admin.",
    });
  }
}
