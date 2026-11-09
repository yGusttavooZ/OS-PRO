import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { storage } from "@/lib/firebase";
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
    const invite = {
      ...payload, user_email: email, status: payload.status || "invited",
      created_date: new Date().toISOString(), created_at: serverTimestamp(),
    };
    await setDoc(doc(db, "memberships", id), invite);
    await setDoc(doc(db, "invites", id), {
      email, company_id: payload.company_id, company_name: payload.company_name || "",
      role: payload.role || "attendant", status: "pending",
      invited_by: auth.currentUser?.uid || "", created_at: serverTimestamp(),
    });
    return { id, ...invite };
  },
  update: async (id, payload) => {
    if (entityName !== "Membership") return updateRecord(entityName, id, payload);
    const memberRef = doc(db, "memberships", id);
    await updateDoc(memberRef, { ...payload, updated_at: serverTimestamp() });
    const current = await (await import("firebase/firestore")).getDoc(memberRef);
    const member = current.exists() ? current.data() : {};
    if (member.company_id && member.user_id) {
      await updateDoc(doc(db, "companies", member.company_id, "members", member.user_id), {
        ...payload, updated_at: serverTimestamp(),
      });
    } else if (member.user_email) {
      await updateDoc(doc(db, "invites", emailKey(member.user_email)), {
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.status ? { status: payload.status === "inactive" ? "inactive" : "pending" } : {}),
        updated_at: serverTimestamp(),
      });
    }
    return { id, ...member, ...payload };
  },
  delete: async (id) => {
    if (entityName !== "Membership") return deleteRecord(entityName, id);
    const memberRef = doc(db, "memberships", id);
    const current = await (await import("firebase/firestore")).getDoc(memberRef);
    if (current.exists()) {
      const member = current.data();
      if (member.company_id && member.user_id) {
        await deleteDoc(doc(db, "companies", member.company_id, "members", member.user_id));
      } else if (member.user_email) {
        await deleteDoc(doc(db, "invites", emailKey(member.user_email)));
      }
    }
    await deleteDoc(memberRef);
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
    UploadPrivateFile: async ({ file }) => {
      const safeName = String(file?.name || "arquivo").replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileRef = ref(storage, `uploads/${auth.currentUser?.uid || "anonymous"}/${Date.now()}-${safeName}`);
      await uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
      return { file_uri: await getDownloadURL(fileRef) };
    },
    CreateFileSignedUrl: async ({ file_uri }) => ({ signed_url: file_uri }),
  },
};

export const base44 = { entities, auth: authApi, users, integrations };
