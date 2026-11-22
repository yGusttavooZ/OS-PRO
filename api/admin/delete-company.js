import { adminAuth, adminDb } from "../../server/firebaseAdmin.js";

const COMPANY_COLLECTIONS = [
  "memberships",
  "serviceOrders",
  "clients",
  "equipment",
  "transactions",
  "orderEvents",
  "auditLogs",
  "planRequests",
  "invites",
];

function send(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Método não permitido." });
  }

  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return send(res, 401, { error: "Sessão não autenticada." });

    const decoded = await adminAuth.verifyIdToken(token);
    const adminUser = await adminDb.collection("users").doc(decoded.uid).get();
    if (!adminUser.exists || adminUser.data()?.platform_role !== "platform_admin") {
      return send(res, 403, { error: "Apenas o administrador da plataforma pode excluir empresas." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const companyId = String(body.companyId || "").trim();
    const confirmationName = String(body.confirmationName || "").trim();
    if (!companyId || !confirmationName) {
      return send(res, 400, { error: "Informe a empresa e confirme o nome." });
    }

    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) return send(res, 404, { error: "Empresa não encontrada." });

    const company = companySnap.data();
    const companyName = String(company.name || "").trim();
    if (confirmationName !== companyName) {
      return send(res, 400, { error: "O nome digitado não corresponde ao cadastro da empresa." });
    }

    // Identifica os usuários vinculados antes de remover os vínculos.
    const [companyMembers, memberships] = await Promise.all([
      companyRef.collection("members").get(),
      adminDb.collection("memberships").where("company_id", "==", companyId).get(),
    ]);
    const candidateUids = new Set([
      ...companyMembers.docs.map((item) => item.id),
      ...memberships.docs.map((item) => item.data()?.user_id).filter(Boolean),
      company.owner_uid,
    ].filter((uid) => typeof uid === "string" && uid));

    const removableUids = [];
    const retainedSharedUids = [];
    for (const uid of candidateUids) {
      const profileSnap = await adminDb.collection("users").doc(uid).get();
      if (profileSnap.data()?.platform_role === "platform_admin") continue;
      const otherMemberships = await adminDb.collection("memberships")
        .where("user_id", "==", uid).get();
      const belongsElsewhere = otherMemberships.docs.some((item) => item.data()?.company_id !== companyId);
      if (belongsElsewhere) retainedSharedUids.push(uid);
      else removableUids.push(uid);
    }

    const deletionCounts = {};
    const deleteDocument = async (ref) => {
      await adminDb.recursiveDelete(ref);
    };

    // Apaga documentos de nível superior identificados pelo company_id.
    for (const collectionName of COMPANY_COLLECTIONS) {
      const snapshot = await adminDb.collection(collectionName)
        .where("company_id", "==", companyId).get();
      for (const item of snapshot.docs) await deleteDocument(item.ref);
      deletionCounts[collectionName] = snapshot.size;
    }

    // Remove perfis do app somente quando o usuário não pertence a outra empresa.
    let profilesDeleted = 0;
    for (const uid of removableUids) {
      const profileRef = adminDb.collection("users").doc(uid);
      const profile = await profileRef.get();
      if (profile.exists && profile.data()?.company_id === companyId) {
        await deleteDocument(profileRef);
        profilesDeleted += 1;
      }
    }
    deletionCounts.users = profilesDeleted;

    const accountRef = adminDb.collection("companyAccounts").doc(companyId);
    const accountSnap = await accountRef.get();
    if (accountSnap.exists) {
      await accountRef.delete();
      deletionCounts.companyAccounts = 1;
    } else {
      deletionCounts.companyAccounts = 0;
    }

    // A exclusão recursiva remove também members, counters e auditLogs da empresa.
    await deleteDocument(companyRef);
    deletionCounts.company = 1;

    // Exclui contas Auth individuais. Contas compartilhadas com outra empresa são preservadas.
    const authDeletionFailures = [];
    for (const uid of removableUids) {
      try {
        await adminAuth.deleteUser(uid);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") {
          authDeletionFailures.push({ uid, message: error?.message || "Falha ao excluir usuário." });
        }
      }
    }

    await adminDb.collection("auditLogs").add({
      action: "company_deleted",
      target: companyId,
      company_id: companyId,
      company_name: companyName,
      admin_uid: decoded.uid,
      admin_email: decoded.email || adminUser.data()?.email || "",
      at: new Date().toISOString(),
      deleted_counts: deletionCounts,
      retained_shared_user_count: retainedSharedUids.length,
      auth_deletion_failures: authDeletionFailures,
      status: authDeletionFailures.length ? "partial_auth_cleanup" : "completed",
    });

    return send(res, 200, {
      success: true,
      companyName,
      deletedCounts: deletionCounts,
      retainedSharedUsers: retainedSharedUids.length,
      authDeletionFailures,
    });
  } catch (error) {
    console.error("Falha na exclusão da empresa:", error);
    return send(res, 500, { error: error?.message || "Não foi possível concluir a exclusão." });
  }
}
