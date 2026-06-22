import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clearAll() {
  console.log("Starting DB purge...");

  // Clear Clubs
  const clubsSnap = await getDocs(collection(db, "clubs"));
  for (const d of clubsSnap.docs) {
    await deleteDoc(d.ref);
  }
  console.log(`Clubs cleared: ${clubsSnap.size}`);

  // Clear Approvals
  const appSnap = await getDocs(collection(db, "approvals"));
  for (const d of appSnap.docs) {
    await deleteDoc(d.ref);
  }
  console.log(`Approvals cleared: ${appSnap.size}`);

  // Clear Users (except admins)
  const usersSnap = await getDocs(collection(db, "users"));
  let usersDeleted = 0;
  for (const d of usersSnap.docs) {
    const data = d.data();
    if (data.role !== "admin") {
      await deleteDoc(d.ref);
      usersDeleted++;
    }
  }
  console.log(`Users cleared: ${usersDeleted}`);
}

clearAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
