const form = document.querySelector("[data-interest-form]");
const status = document.querySelector("[data-form-status]");

if (form && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    submitButton.disabled = true;
    status.textContent = "Guardando tu informacion...";
    status.dataset.state = "loading";

    try {
      const response = await fetch("/.netlify/functions/save-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No fue posible guardar el registro.");
      }

      form.reset();
      status.textContent =
        "Registro enviado correctamente. Ya quedo guardado en Firebase.";
      status.dataset.state = "success";
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = "error";
    } finally {
      submitButton.disabled = false;
    }
  });
}
