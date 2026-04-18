const liveMessage = document.getElementById("live-message");
const statusLight = document.getElementById("status-light");
const startArExperienceButton = document.getElementById("start-ar-experience");
const arStatus = document.getElementById("ar-status");
const arSceneMount = document.getElementById("ar-scene-mount");
const arSceneTemplate = document.getElementById("ar-scene-template");
const fullscreenArShell = document.getElementById("fullscreen-ar-shell");
const closeArExperienceButton = document.getElementById("close-ar-experience");

let markerDetected = false;
let scene = null;
let arStarted = false;
let trackedMarkers = [];
let activeMarkers = new Set();
let trackedModels = [];
let boundMarkerEvents = false;
let sceneFeedbackReady = false;

function setBannerState(type, message) {
  if (!statusLight || !liveMessage) {
    return;
  }

  statusLight.classList.remove("is-success", "is-error", "is-info");

  if (type === "success") {
    statusLight.classList.add("is-success");
  } else if (type === "error") {
    statusLight.classList.add("is-error");
  } else if (type === "info") {
    statusLight.classList.add("is-info");
  }

  liveMessage.textContent = message;
}

function evaluateSupport() {
  const hasMediaDevices =
    Boolean(navigator.mediaDevices) &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  const hasWebGL = (() => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (error) {
      return false;
    }
  })();

  if (hasMediaDevices && hasWebGL) {
    setBannerState("info", "Escena compatible. Esperando acceso a la camara...");
  } else {
    setBannerState(
      "error",
      "Este navegador no ofrece soporte completo para la experiencia WebAR."
    );
  }

}

function bindArEvents() {
  if (!scene || trackedMarkers.length === 0 || boundMarkerEvents) {
    return;
  }

  boundMarkerEvents = true;

  trackedMarkers.forEach((trackedMarker) => {
    const markerLabel = trackedMarker.dataset.markerLabel || "Marcador";
    const modelEntity = trackedMarker.querySelector(".marker-model-entity");
    const modelName = modelEntity?.dataset.modelName || markerLabel;

    trackedMarker.addEventListener("markerFound", () => {
      activeMarkers.add(markerLabel);
      markerDetected = activeMarkers.size > 0;

      ensureModelLoaded(modelEntity);
      setBannerState(
        "success",
        `Marcador detectado: ${markerLabel}. Cargando ${modelName} en la escena.`
      );
    });

    trackedMarker.addEventListener("markerLost", () => {
      activeMarkers.delete(markerLabel);
      markerDetected = activeMarkers.size > 0;

      if (activeMarkers.size > 0) {
        const [nextMarker] = activeMarkers;
        setBannerState(
          "info",
          `Marcador activo: ${nextMarker}. Puedes cambiar a cualquier otro del menu.`
        );
        return;
      }

      setBannerState(
        "info",
        "Marcador fuera de vista. Vuelve a apuntar a Hiro o a cualquiera del menu."
      );
    });
  });

  window.setTimeout(() => {
    if (!markerDetected) {
      setBannerState(
        "info",
        "Permite la camara y apunta a Hiro o a cualquiera de los marcadores del menu."
      );
    }
  }, 5000);
}

function bindSceneFeedback() {
  if (!scene || sceneFeedbackReady) {
    return;
  }

  sceneFeedbackReady = true;

  scene.addEventListener("loaded", () => {
    setBannerState("info", "Escena cargada. Permite la camara y apunta a uno de los marcadores.");
  });

  scene.addEventListener("camera-init", () => {
    setBannerState("info", "Camara activa. Busca Hiro o cualquiera de los marcadores del menu.");
  });

  scene.addEventListener("camera-error", () => {
    setBannerState("error", "La camara fue bloqueada o no esta disponible en este dispositivo.");
  });
}

function ensureModelLoaded(modelEntity) {
  if (!modelEntity) {
    return;
  }

  const modelSrc = modelEntity.dataset.modelSrc;

  if (!modelSrc || modelEntity.dataset.modelLoaded === "true") {
    return;
  }

  if (modelEntity.dataset.modelLoading === "true") {
    return;
  }

  modelEntity.dataset.modelLoading = "true";
  modelEntity.setAttribute("gltf-model", modelSrc);
}

function mountArScene() {
  if (arStarted || !arSceneMount || !arSceneTemplate) {
    return;
  }

  arSceneMount.appendChild(arSceneTemplate.content.cloneNode(true));
  scene = document.getElementById("ar-scene");
  trackedMarkers = Array.from(document.querySelectorAll("[data-marker-label]"));
  trackedModels = Array.from(document.querySelectorAll(".marker-model-entity"));
  activeMarkers = new Set();
  arStarted = true;

  if (arStatus) {
    arStatus.textContent =
      "Experiencia AR activada. Permite la camara y apunta a Hiro o a cualquier marcador del menu.";
  }

  if (startArExperienceButton) {
    startArExperienceButton.disabled = true;
    startArExperienceButton.textContent = "Experiencia AR activa";
  }

  trackedModels.forEach((modelEntity) => {
    const modelName = modelEntity.dataset.modelName || "Modelo 3D";

    modelEntity.addEventListener("model-loaded", () => {
      modelEntity.dataset.modelLoaded = "true";
      modelEntity.dataset.modelLoading = "false";
      setBannerState("info", `${modelName} listo. Ya puedes apuntar al marcador correspondiente.`);
    });

    modelEntity.addEventListener("model-error", () => {
      modelEntity.dataset.modelLoading = "false";
      setBannerState(
        "error",
        `No se pudo cargar ${modelName}. Recarga la pagina si el problema continua.`
      );
    });
  });

  bindSceneFeedback();
  bindArEvents();
}

function openArExperience() {
  if (fullscreenArShell) {
    fullscreenArShell.hidden = false;
    document.body.classList.add("has-fullscreen-ar");
  }

  mountArScene();
}

function closeArExperience() {
  if (fullscreenArShell) {
    fullscreenArShell.hidden = true;
  }

  document.body.classList.remove("has-fullscreen-ar");
}

evaluateSupport();

if (startArExperienceButton) {
  startArExperienceButton.addEventListener("click", openArExperience);
}

if (closeArExperienceButton) {
  closeArExperienceButton.addEventListener("click", closeArExperience);
}
