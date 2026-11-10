import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const actionCodeSettings = {
  url: `${window.location.origin}/login`,
  handleCodeInApp: false,
};

export async function registerWithEmail(fullName, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await updateProfile(credential.user, { displayName: fullName.trim() });
  await sendEmailVerification(credential.user, actionCodeSettings);
  await signOut(auth);
  return credential.user;
}

export async function resendVerification(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await sendEmailVerification(credential.user, actionCodeSettings);
  await signOut(auth);
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await credential.user.reload();
  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw new Error("Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada.");
  }
  return credential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function requestPasswordReset(email) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
  });
}

export async function applyPasswordReset(code, password) {
  return confirmPasswordReset(auth, code, password);
}
