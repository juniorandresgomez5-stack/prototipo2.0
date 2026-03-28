import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const form = document.querySelector("[data-interest-form]");
const status = document.querySelector("[data-form-status]");

const missingConfig = Object.entries(firebaseConfig).filter(([, value]) =>
  String(value).startsWith("REEMPLAZA_")
);

let db = null;

if (missingConfig.length === 0) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

if (status && missingConfig.length > 0) {
  status.textContent =
    "Falta completar firebase-config.js con los datos reales de tu proyecto Firebase.";
  status.dataset.state = "error";
}

if (form && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!db) {
      status.textContent =
        "La conexion a Firebase aun no esta configurada en firebase-config.js.";
      status.dataset.state = "error";
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    submitButton.disabled = true;
    status.textContent = "Guardando tu informacion en Firebase...";
    status.dataset.state = "loading";

    try {
      await addDoc(collection(db, "prototype_submissions"), {
        name: String(payload.name || "").trim(),
        email: String(payload.email || "").trim(),
        role: String(payload.role || "").trim(),
        notes: String(payload.notes || "").trim(),
        createdAt: serverTimestamp(),
        source: "github-pages"
      });

      form.reset();
      status.textContent =
        "Registro enviado correctamente. Ya quedo guardado en Firestore.";
      status.dataset.state = "success";
    } catch (error) {
      status.textContent =
        error.message || "No fue posible guardar el registro en Firebase.";
      status.dataset.state = "error";
    } finally {
      submitButton.disabled = false;
    }
  });
}
