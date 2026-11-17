import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import {
  countRecords, createRecord, deleteRecord, deleteRecords,
  paged, updateRecord,
} from "@/lib/tenant";

const emailKey = (value = "") => String(value).trim().toLowerCase();

const entityApi = (entityName) => ({
  filter: (filters = {}, options = {}) => paged(entityName, filters, options),
  create: async (payload) => {
    if (entityName !== "Membership") return createRecord(entityName, payload);
    const email = emailKey(payload.user_email || payload.email);
    if (!email) throw new Error("Informe o e-mail do membro.");
    const companyId = payload.company_id;
    if (!companyId) throw new Error("Não foi possível identificar a empresa do convite.");

    const memberRef = doc(db, "memberships", email);
    const inviteRef = doc(db, "invites", email);
    const accountRef = doc(db, "companyAccounts", companyId);
    const timestamp = serverTimestamp();
    const role = payload.role || "attendant";

    await runTransaction(db, async (transaction) => {
      const [memberSnap, inviteSnap, accountSnap] = await Promise.all([
        transaction.get(memberRef),
        transaction.get(inviteRef),
        transaction.get(accountRef),
      ]);
      if (!accountSnap.exists()) throw new Error("Assinatura da empresa não encontrada.");
      const account = accountSnap.data();
      if (!Number.isInteger(account.reserved_users)) {
        throw new Error("O controle de vagas ainda precisa ser inicializado pelo proprietário.");
      }
      if (inviteSnap.exists() && inviteSnap.data().company_id !== companyId) {
        throw new Error("Este e-mail já possui um convite registrado em outra empresa.");
      }
      if (memberSnap.exists() && memberSnap.data().company_id !== companyId) {
        throw new Error("Este e-mail já está vinculado a outra empresa.");
      }
      if (memberSnap.exists() && memberSnap.data().status === "active") {
        throw new Error("Este funcionário já possui acesso ativo à empresa.");
      }

      const alreadyReserved = inviteSnap.exists() && inviteSnap.data().status === "pending";
      if (!alreadyReserved) {
        const next = account.reserved_users + 1;
        if (next > Number(account.max_users || 0)) {
          throw new Error(`Limite do plano atingido: ${account.max_users || 0} usuários.`);
        }
        transaction.update(accountRef, { reserved_users: next, seat_change_email: email, seat_change_member_id: email, seat_change_action: "reserve", seat_change_at: timestamp, updated_at: timestamp });
      }

      const invite = {
        ...payload, user_email: email, status: "invited",
        created_date: new Date().toISOString(), created_at: timestamp,
      };
      transaction.set(memberRef, invite);
      transaction.set(inviteRef, {
        email, company_id: companyId, company_name: payload.company_name || "",
        role, status: "pending",
        invited_by: auth.currentUser?.uid || "",
        ...(inviteSnap.exists() ? {} : { created_at: timestamp }),
        updated_at: timestamp,
      }, { merge: true });
    });
    return { id: email, ...payload, user_email: email, status: "invited" };
  },
  update: async (id, payload) => {
    if (entityName !== "Membership") return updateRecord(entityName, id, payload);
    const memberRef = doc(db, "memberships", id);
    const timestamp = serverTimestamp();

    await runTransaction(db, async (transaction) => {
      const memberSnap = await transaction.get(memberRef);
      if (!memberSnap.exists()) throw new Error("Membro não encontrado.");
      const member = memberSnap.data();
      const companyId = member.company_id;
      if (!companyId) throw new Error("Empresa do membro não identificada.");
      const accountRef = doc(db, "companyAccounts", companyId);
      const nestedRef = member.user_id
        ? doc(db, "companies", companyId, "members", member.user_id)
        : null;
      const inviteRef = member.user_email
        ? doc(db, "invites", emailKey(member.user_email))
        : null;
      const [accountSnap, nestedSnap, inviteSnap] = await Promise.all([
        transaction.get(accountRef),
        nestedRef ? transaction.get(nestedRef) : Promise.resolve(null),
        inviteRef ? transaction.get(inviteRef) : Promise.resolve(null),
      ]);
      if (!accountSnap.exists() || !Number.isInteger(accountSnap.data().reserved_users)) {
        throw new Error("O controle de vagas ainda não foi inicializado.");
      }

      const nextStatus = payload.status || member.status;
      let delta = 0;
      const wasReserved = ["active", "invited"].includes(member.status);
      const willBeReserved = ["active", "invited"].includes(nextStatus);
      if (wasReserved !== willBeReserved) delta = willBeReserved ? 1 : -1;

      if (delta > 0) {
        const next = accountSnap.data().reserved_users + 1;
        if (next > Number(accountSnap.data().max_users || 0)) {
          throw new Error(`Limite do plano atingido: ${accountSnap.data().max_users || 0} usuários.`);
        }
        transaction.update(accountRef, { reserved_users: next, seat_change_email: emailKey(member.user_email || id), seat_change_member_id: id, seat_change_action: "reserve", seat_change_at: timestamp, updated_at: timestamp });
      } else if (delta < 0) {
        transaction.update(accountRef, {
          reserved_users: Math.max(0, accountSnap.data().reserved_users - 1),
          seat_change_email: emailKey(member.user_email || id),
          seat_change_member_id: id,
          seat_change_action: "release",
          seat_change_at: timestamp,
          updated_at: timestamp,
        });
      }

      transaction.update(memberRef, { ...payload, updated_at: timestamp });
      if (nestedRef && nestedSnap?.exists()) {
        transaction.update(nestedRef, { ...payload, updated_at: timestamp });
      } else if (inviteRef && inviteSnap?.exists()) {
        transaction.update(inviteRef, {
          ...(payload.role ? { role: payload.role } : {}),
          ...(payload.status ? { status: payload.status === "inactive" ? "inactive" : "pending" } : {}),
          updated_at: timestamp,
        });
      }
    });
    return { id, ...payload };
  },
  delete: async (id) => {
    if (entityName !== "Membership") return deleteRecord(entityName, id);
    const memberRef = doc(db, "memberships", id);
    const timestamp = serverTimestamp();

    await runTransaction(db, async (transaction) => {
      const memberSnap = await transaction.get(memberRef);
      if (!memberSnap.exists()) return;
      const member = memberSnap.data();
      const companyId = member.company_id;
      if (!companyId) throw new Error("Empresa do membro não identificada.");
      const accountRef = doc(db, "companyAccounts", companyId);
      const nestedRef = member.user_id
        ? doc(db, "companies", companyId, "members", member.user_id)
        : null;
      const inviteRef = member.user_email
        ? doc(db, "invites", emailKey(member.user_email))
        : null;
      const [accountSnap, nestedSnap, inviteSnap] = await Promise.all([
        transaction.get(accountRef),
        nestedRef ? transaction.get(nestedRef) : Promise.resolve(null),
        inviteRef ? transaction.get(inviteRef) : Promise.resolve(null),
      ]);
      if (!accountSnap.exists() || !Number.isInteger(accountSnap.data().reserved_users)) {
        throw new Error("O controle de vagas ainda não foi inicializado.");
      }
      if (["active", "invited"].includes(member.status)) {
        transaction.update(accountRef, {
          reserved_users: Math.max(0, accountSnap.data().reserved_users - 1),
          seat_change_email: emailKey(member.user_email || id),
          seat_change_action: "release",
          seat_change_at: timestamp,
          updated_at: timestamp,
        });
      }
      if (nestedRef && nestedSnap?.exists()) transaction.delete(nestedRef);
      if (inviteRef && inviteSnap?.exists() && inviteSnap.data().company_id === companyId) {
        transaction.delete(inviteRef);
      }
      transaction.delete(memberRef);
    });
  },
  deleteMany: (filters = {}) => deleteRecords(entityName, filters),
  count: (filters = {}) => countRecords(entityName, filters),
});

const entities = new Proxy({}, {
  get: (_target, entityName) => entityApi(String(entityName)),
});

const authApi = {
  me: async () => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    return auth.currentUser;
  },
  setToken: () => {},
  loginWithProvider: async (provider) => {
    const authProvider = provider === "google"
      ? new GoogleAuthProvider()
      : new OAuthProvider(provider);
    return signInWithPopup(auth, authProvider);
  },
};

const users = { inviteUser: async () => null };

const integrations = {
  Core: {
    UploadPrivateFile: async () => {
      throw new Error("Envio de arquivos está desativado. Para logotipos, informe uma URL pública nas configurações da empresa.");
    },
    CreateFileSignedUrl: async ({ file_uri }) => ({ signed_url: file_uri }),
  },
};

export const base44 = { entities, auth: authApi, users, integrations };
