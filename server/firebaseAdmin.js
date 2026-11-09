import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT não configurada na Vercel.");
  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT precisa conter um JSON válido.");
  }
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error("A credencial do Firebase Admin está incompleta.");
  }
  return account;
}

const serviceAccount = readServiceAccount();
const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
