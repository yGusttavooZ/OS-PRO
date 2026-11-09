import {
  collection, doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
const DEFAULT_WARRANTY = "A garantia cobre exclusivamente os serviços executados e as peças substituídas nesta ordem de serviço, pelo prazo indicado acima, contado da data de entrega do equipamento. Não estão cobertos danos por mau uso, quedas, oxidação, sobrecarga elétrica, violação por terceiros, vírus e arquivos pessoais. Os dados armazenados no equipamento são de responsabilidade do cliente, sendo recomendado backup prévio. Equipamentos não retirados em até 90 dias após a comunicação de conclusão poderão ser considerados abandonados, conforme o artigo 1.275 do Código Civil.";

const emailKey = (email = "") => email.trim().toLowerCase();

export async function loadTenantProfile(user) {
  if (!user?.uid) return { userProfile: null, company: null, account: null, membership: null };
  const profileSnap = await getDoc(doc(db, "users", user.uid));
  const userProfile = profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null;
  const companyId = userProfile?.company_id;
  if (!companyId) return { userProfile, company: null, account: null, membership: null };

  const [companySnap, memberSnap, accountSnap] = await Promise.all([
    getDoc(doc(db, "companies", companyId)),
    getDoc(doc(db, "companies", companyId, "members", user.uid)),
    getDoc(doc(db, "companyAccounts", companyId)),
  ]);
  return {
    userProfile,
    company: companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } : null,
    account: accountSnap.exists() ? { id: accountSnap.id, ...accountSnap.data() } : null,
    membership: memberSnap.exists() ? { id: memberSnap.id, ...memberSnap.data() } : null,
  };
}

export async function findPendingInvite(email) {
  if (!email) return null;
  const inviteRef = doc(db, "invites", emailKey(email));
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) return null;
  const invite = { id: snap.id, ...snap.data() };
  return invite.status === "pending" ? invite : null;
}

export async function acceptCompanyInvite({ user, invite }) {
  if (!user?.uid || !user.email || emailKey(user.email) !== invite?.id) {
    throw new Error("O convite não corresponde ao e-mail desta conta.");
  }
  const inviteRef = doc(db, "invites", invite.id);
  const companyRef = doc(db, "companies", invite.company_id);
  const memberRef = doc(db, "companies", invite.company_id, "members", user.uid);
  const legacyMemberRef = doc(db, "memberships", invite.id);
  const activeMemberRef = doc(db, "memberships", user.uid);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    const [inviteSnap, companySnap, userSnap, memberSnap] = await Promise.all([
      transaction.get(inviteRef),
      transaction.get(companyRef),
      transaction.get(userRef),
      transaction.get(memberRef),
    ]);
    if (!inviteSnap.exists() || inviteSnap.data().status !== "pending") {
      throw new Error("Este convite não está mais disponível.");
    }
    if (!companySnap.exists()) throw new Error("A empresa do convite não foi encontrada.");
    if (userSnap.exists() && userSnap.data().company_id) {
      throw new Error(userSnap.data().company_id === invite.company_id
        ? "Sua conta já está vinculada a esta empresa."
        : "Sua conta já está vinculada a outra empresa.");
    }
    if (memberSnap.exists()) {
      throw new Error("Você já possui um vínculo com esta empresa.");
    }
    const currentInvite = inviteSnap.data();
    if (emailKey(currentInvite.email) !== emailKey(user.email)) {
      throw new Error("Este convite foi enviado para outro e-mail.");
    }
    const role = ["admin", "technician", "attendant"].includes(currentInvite.role)
      ? currentInvite.role : "attendant";
    transaction.set(memberRef, {
      uid: user.uid, email: user.email, name: user.full_name || user.email,
      role, status: "active", created_at: serverTimestamp(),
    });
    transaction.set(activeMemberRef, {
      uid: user.uid, user_id: user.uid, user_email: emailKey(user.email),
      user_name: user.full_name || user.email, company_id: invite.company_id,
      company_name: companySnap.data().name || "", role, status: "active",
      created_at: serverTimestamp(),
    });
    if (legacyMemberRef.id !== activeMemberRef.id) transaction.delete(legacyMemberRef);
    transaction.set(userRef, {
      uid: user.uid, email: user.email, full_name: user.full_name || user.email,
      company_id: invite.company_id, company_name: companySnap.data().name || "",
      company_role: role, updated_at: serverTimestamp(),
    }, { merge: true });
    transaction.update(inviteRef, { status: "accepted", accepted_by: user.uid, accepted_at: serverTimestamp() });
  });
}

export async function createCompanyForUser({ user, form }) {
  if (!user?.uid) throw new Error("Faça login novamente para continuar.");
  const companyRef = doc(collection(db, "companies"));
  const memberRef = doc(db, "companies", companyRef.id, "members", user.uid);
  const accountRef = doc(db, "companyAccounts", companyRef.id);
  const counterRef = doc(db, "companies", companyRef.id, "counters", "doc");
  const userRef = doc(db, "users", user.uid);
  const companyName = form.name.trim();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const company = {
    name: companyName, legal_name: companyName, trade_name: companyName,
    document: form.document || "", phone: form.phone || "", whatsapp: form.phone || "",
    email: form.email || user.email || "", city: form.city || "",
    state: form.state ? form.state.toUpperCase() : "",
    tech_responsible: form.tech_responsible || user.full_name || "",
    owner_uid: user.uid, owner_email: user.email || "", company_id: companyRef.id,
    warranty_terms: DEFAULT_WARRANTY, warranty_days: 90, doc_start_number: 1,
    plan: "initial", created_at: serverTimestamp(), updated_at: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(userRef);
    if (existing.exists() && existing.data().company_id) {
      throw new Error("Esta conta já está vinculada a uma empresa.");
    }
    transaction.set(companyRef, company);
    transaction.set(memberRef, {
      uid: user.uid, email: user.email || "", name: user.full_name || user.email || "",
      role: "admin", status: "active", created_at: serverTimestamp(),
    });
    transaction.set(doc(db, "memberships", user.uid), {
      uid: user.uid, user_id: user.uid, user_email: emailKey(user.email),
      user_name: user.full_name || user.email || "", company_id: companyRef.id,
      company_name: companyName, role: "admin", status: "active", created_at: serverTimestamp(),
    });
    transaction.set(accountRef, {
      company_id: companyRef.id, company_name: companyName, status: "trial",
      plan_id: "", plan_name: "Período de teste", price: 0,
      trial_ends_at: trialEnd, contact_email: user.email || "",
      created_at: serverTimestamp(),
    });
    transaction.set(counterRef, { key: "doc", value: 2, updated_at: serverTimestamp() });
    transaction.set(userRef, {
      uid: user.uid, email: user.email || "", full_name: user.full_name || "",
      company_id: companyRef.id, company_name: companyName, company_role: "admin",
      created_at: serverTimestamp(), updated_at: serverTimestamp(),
    }, { merge: true });
  });

  return { id: companyRef.id, ...company };
}

export async function updateCompany(companyId, fields) {
  await updateDoc(doc(db, "companies", companyId), {
    ...fields, updated_at: serverTimestamp(),
  });
}

export async function writeCompanyAudit(companyId, user, action, target, note = "") {
  await setDoc(doc(collection(db, "companies", companyId, "auditLogs")), {
    actor_uid: user?.uid || user?.id || "", actor_email: user?.email || "",
    actor_role: user?.company_role || user?.role || "", action,
    target: target || "", note: note || "", at: serverTimestamp(),
  });
}
