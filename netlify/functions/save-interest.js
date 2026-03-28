"use strict";

const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

const REQUIRED_ENV_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
];

function ensureFirebaseConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(", ")}`
    );
  }
}

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  ensureFirebaseConfig();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      ok: false,
      message: "Use POST to send data to this endpoint."
    });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const role = String(payload.role || "").trim();
    const notes = String(payload.notes || "").trim();

    if (!name || !role) {
      return jsonResponse(400, {
        ok: false,
        message: "Name and role are required."
      });
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);

    const docRef = await db.collection("prototype_submissions").add({
      name,
      email,
      role,
      notes,
      createdAt: FieldValue.serverTimestamp(),
      source: "netlify-site",
      userAgent: event.headers["user-agent"] || "unknown"
    });

    return jsonResponse(200, {
      ok: true,
      id: docRef.id,
      message: "Registration saved in Firebase."
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      message: "The record could not be saved.",
      details: error.message
    });
  }
};
