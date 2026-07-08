import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = getFirestore();

const ALLOWED_ORIGINS = [
    "https://comedor-ar.vercel.app",
    "https://fenicia-phi.vercel.app/"
];

export default async function handler(req, res) {
    const origin = req.headers.origin;
    console.log("Received origin:", origin);

    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") {
        console.log("Rejected method:", req.method);
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
        console.log("Origin not allowed:", origin);
        return res.status(403).json({ error: "Origin not allowed" });
    }

    console.log("Received body:", req.body);

    const { interactive, target, session, device } = req.body;
    if (!interactive || !target || !session) {
        console.log("Missing fields:", { interactive, target, session, device });
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        console.log("Attempting Firestore write...");
        const docRef = await db.collection("interactions").add({
            interactive,
            target,
            session,
            device: device || "unknown",
            timestamp: new Date().toISOString()
        });
        console.log("Write succeeded, doc ID:", docRef.id);
        res.status(200).json({ ok: true, id: docRef.id });
    } catch (err) {
        console.error("Firestore write error:", err.message, err.stack);
        res.status(500).json({ error: "Internal error saving document", detail: err.message });
    }
}