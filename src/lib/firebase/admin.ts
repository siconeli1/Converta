import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    adminApp =
      getApps()[0] ??
      initializeApp({
        credential: projectId && clientEmail && privateKey
          ? cert({ projectId, clientEmail, privateKey })
          : applicationDefault(),
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
  }
  return {
    app: adminApp,
    auth: getAuth(adminApp),
    db: getFirestore(adminApp),
    bucket: getStorage(adminApp).bucket(),
  };
}
