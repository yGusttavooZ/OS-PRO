import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
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
    const id = email;
    const memberRef = doc(db, "memberships", id);
    const inviteRef = doc(db, "invites", id);
    const inviteSnap = await getDoc(inviteRef);
    const companyId = payload.company_id;
    if (!companyId) throw new Error("Não foi possível identificar a empresa do convite.");

    if (inviteSnap.exists() && inviteSnap.data().company_id !== companyId) {
      throw new Error("Este e-mail já possui um convite registrado em outra empresa.");
    }

    const timestamp = serverTimestamp();
    const role = payload.role || "attendant";
    const batch = writeBatch(db);
    const invite = {
      ...payload, user_email: email, status: "invited",
      created_date: new Date().toISOString(), created_at: timestamp,
    };

    // O vínculo anterior é removido junto com a exclusão do funcionário.
    // Cria novamente o registro de convite para o e-mail.
    batch.set(memberRef, invite);

    if (inviteSnap.exists()) {
      // Reabre um convite aceito anteriormente, sem substituir campos protegidos.
      batch.update(inviteRef, {
        role, status: "pending", updated_at: timestamp,
      });
    } else {
      batch.set(inviteRef, {
        email, company_id: companyId, company_name: payload.company_name || "",
        role, status: "pending",
        invited_by: auth.currentUser?.uid || "", created_at: timestamp,
      });
    }

    await batch.commit();
    return { id, ...invite };
  },
  update: async (id, payload) => {
    if (entityName !== "Membership") return updateRecord(entityName, id, payload);
    const memberRef = doc(db, "memberships", id);
    const current = await getDoc(memberRef);
    if (!current.exists()) throw new Error("Membro não encontrado.");
    const member = current.data();
    const timestamp = serverTimestamp();
    const batch = writeBatch(db);
    batch.update(memberRef, { ...payload, updated_at: timestamp });
    if (member.company_id && member.user_id) {
      batch.update(doc(db, "companies", member.company_id, "members", member.user_id), {
        ...payload, updated_at: timestamp,
      });
    } else if (member.user_email) {
      batch.update(doc(db, "invites", emailKey(member.user_email)), {
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status === "inactive" ? "inactive" : "pending" } : {}),
        updated_at: timestamp,
      });
    }
    await batch.commit();
    return { id, ...member, ...payload };
  },
  delete: async (id) => {
    if (entityName !== "Membership") return deleteRecord(entityName, id);
    const memberRef = doc(db, "memberships", id);
    const current = await getDoc(memberRef);
    if (!current.exists()) return;
    const member = current.data();
    const batch = writeBatch(db);

    if (member.company_id && member.user_id) {
      batch.delete(doc(db, "companies", member.company_id, "members", member.user_id));
    }

    if (member.user_email) {
      const inviteRef = doc(db, "invites", emailKey(member.user_email));
      const inviteSnapshot = await getDoc(inviteRef);
      if (
        inviteSnapshot.exists()
        && inviteSnapshot.data().company_id === member.company_id
      ) {
        batch.delete(inviteRef);
      }
    }

    batch.delete(memberRef);
    await batch.commit();
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
