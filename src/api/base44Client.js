import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth } from "@/lib/firebase";
import { storage } from "@/lib/firebase";
import {
  countRecords, createRecord, deleteRecord, deleteRecords,
  paged, updateRecord,
} from "@/lib/tenant";

const entityApi = (entityName) => ({
  filter: (filters = {}, options = {}) => paged(entityName, filters, options),
  create: (payload) => createRecord(entityName, payload),
  update: (id, payload) => updateRecord(entityName, id, payload),
  delete: (id) => deleteRecord(entityName, id),
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

export const base44 = { entities, auth: authApi, integrations };
