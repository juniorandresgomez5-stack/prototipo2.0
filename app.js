const liveMessage = document.getElementById("live-message");
const statusLight = document.getElementById("status-light");
const startQrScanButton = document.getElementById("start-qr-scan");
const qrStatus = document.getElementById("qr-status");
const qrScanner = document.getElementById("qr-scanner");
const qrVideo = document.getElementById("qr-video");
const qrResult = document.getElementById("qr-result");
const qrImagePreview = document.getElementById("qr-image-preview");
const qrImageLink = document.getElementById("qr-image-link");
const startArExperienceButton = document.getElementById("start-ar-experience");
const arStatus = document.getElementById("ar-status");
const arSceneMount = document.getElementById("ar-scene-mount");
const arSceneTemplate = document.getElementById("ar-scene-template");

let markerDetected = false;
let qrStream = null;
let qrDetector = null;
let qrAnimationFrame = null;
let qrScanActive = false;
let qrCanvas = null;
let qrCanvasContext = null;
let scene = null;
let arStarted = false;
let trackedMarkers = [];
let activeMarkers = new Set();
let arViewportSync = null;

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

  if (qrStatus && startQrScanButton && !("BarcodeDetector" in window)) {
    qrStatus.textContent =
      "Este navegador no incluye lector QR nativo. Prueba con Chrome o Edge reciente en el celular.";
    startQrScanButton.disabled = true;
  }
}

function bindArEvents() {
  if (!scene || trackedMarkers.length === 0) {
    return;
  }

  scene.addEventListener("loaded", () => {
    syncArViewport();
    setBannerState("info", "Escena cargada. Permite la camara y apunta al marcador Hiro.");
  });

  scene.addEventListener("camera-init", () => {
    syncArViewport();
    setBannerState("info", "Camara activa. Busca el marcador Hiro para iniciar la proyeccion.");
  });

  scene.addEventListener("camera-error", () => {
    setBannerState("error", "La camara fue bloqueada o no esta disponible en este dispositivo.");
  });

  trackedMarkers.forEach((trackedMarker) => {
    const markerLabel = trackedMarker.dataset.markerLabel || "Marcador";

    trackedMarker.addEventListener("markerFound", () => {
      activeMarkers.add(markerLabel);
      markerDetected = activeMarkers.size > 0;
      setBannerState(
        "success",
        `Marcador detectado: ${markerLabel}. El contenido esta proyectado en tiempo real.`
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

function syncArViewport() {
  if (!arSceneMount) {
    return;
  }

  const arVideo = document.querySelector(".arjs-video");
  const arCanvas = document.querySelector(".a-canvas");
  const sceneCanvas = scene ? scene.querySelector("canvas") : null;

  [arVideo, arCanvas, sceneCanvas].forEach((node) => {
    if (!node) {
      return;
    }

    node.classList.add("contained-ar-layer");

    if (node.parentElement !== arSceneMount) {
      arSceneMount.appendChild(node);
    }
  });
}

function startArViewportSync() {
  if (arViewportSync || !arSceneMount) {
    return;
  }

  syncArViewport();

  arViewportSync = window.setInterval(() => {
    syncArViewport();
  }, 600);
}

function mountArScene() {
  if (arStarted || !arSceneMount || !arSceneTemplate) {
    return;
  }

  if (qrScanActive) {
    stopQrScanner();
    if (qrStatus) {
      qrStatus.textContent =
        "Escaneo QR detenido para liberar la camara antes de abrir la experiencia AR.";
    }
  }

  arSceneMount.appendChild(arSceneTemplate.content.cloneNode(true));
  scene = document.getElementById("ar-scene");
  trackedMarkers = Array.from(document.querySelectorAll("[data-marker-label]"));
  activeMarkers = new Set();
  arStarted = true;
  startArViewportSync();

  if (arStatus) {
    arStatus.textContent =
      "Experiencia AR activada. Permite la camara y apunta a Hiro o a cualquier marcador del menu.";
  }

  if (startArExperienceButton) {
    startArExperienceButton.disabled = true;
    startArExperienceButton.textContent = "Experiencia AR activa";
  }

  bindArEvents();
}

function getImageUrlFromQrText(rawValue) {
  if (!rawValue) {
    return null;
  }

  const normalizedValue = rawValue.trim();

  if (/^data:image\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(parsedUrl.pathname)) {
      return parsedUrl.toString();
    }
  } catch (error) {
    // Sigue con otros formatos de QR.
  }

  try {
    const parsedJson = JSON.parse(normalizedValue);
    const candidate =
      parsedJson.imageUrl ||
      parsedJson.image ||
      parsedJson.url ||
      parsedJson.src ||
      null;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  } catch (error) {
    // El QR no contiene JSON y no pasa nada.
  }

  return null;
}

function showQrImage(imageUrl) {
  if (!qrImagePreview || !qrImageLink || !qrResult || !qrStatus) {
    return;
  }

  qrImagePreview.src = imageUrl;
  qrImageLink.href = imageUrl;
  qrResult.hidden = false;
  qrStatus.textContent = "QR detectado. La imagen ya esta lista para visualizarse.";
}

function stopQrScanner() {
  qrScanActive = false;

  if (qrAnimationFrame) {
    window.cancelAnimationFrame(qrAnimationFrame);
    qrAnimationFrame = null;
  }

  if (qrStream) {
    qrStream.getTracks().forEach((track) => track.stop());
    qrStream = null;
  }

  if (qrVideo) {
    qrVideo.pause();
    qrVideo.srcObject = null;
  }

  if (qrScanner) {
    qrScanner.classList.remove("is-active");
  }

  if (startQrScanButton) {
    startQrScanButton.textContent = "Abrir camara para QR";
  }
}

async function scanQrFrame() {
  if (!qrScanActive || !qrDetector || !qrVideo.videoWidth || !qrVideo.videoHeight) {
    qrAnimationFrame = window.requestAnimationFrame(scanQrFrame);
    return;
  }

  if (!qrCanvas) {
    qrCanvas = document.createElement("canvas");
    qrCanvasContext = qrCanvas.getContext("2d", { willReadFrequently: true });
  }

  qrCanvas.width = qrVideo.videoWidth;
  qrCanvas.height = qrVideo.videoHeight;
  qrCanvasContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

  try {
    const barcodes = await qrDetector.detect(qrCanvas);

    if (barcodes.length > 0) {
      const rawValue = barcodes[0].rawValue || "";
      const imageUrl = getImageUrlFromQrText(rawValue);

      if (imageUrl) {
        showQrImage(imageUrl);
      } else {
        qrStatus.textContent =
          "Se leyo el QR, pero no contiene una imagen valida. Usa un enlace directo o un JSON con imageUrl.";
      }

      stopQrScanner();
      return;
    }
  } catch (error) {
    qrStatus.textContent = "No fue posible procesar el QR en este momento.";
    stopQrScanner();
    return;
  }

  qrAnimationFrame = window.requestAnimationFrame(scanQrFrame);
}

async function startQrScanner() {
  if (
    !startQrScanButton ||
    !qrStatus ||
    !qrVideo ||
    !qrScanner ||
    !qrResult ||
    !qrImagePreview
  ) {
    return;
  }

  if (qrScanActive) {
    stopQrScanner();
    qrStatus.textContent = "Escaneo detenido. Pulsa el boton si quieres volver a abrir la camara.";
    return;
  }

  qrResult.hidden = true;
  qrImagePreview.removeAttribute("src");

  try {
    qrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    qrDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
    qrVideo.srcObject = qrStream;
    await qrVideo.play();

    qrScanActive = true;
    qrScanner.classList.add("is-active");
    startQrScanButton.textContent = "Detener escaneo QR";
    qrStatus.textContent = "Camara activa. Centra el codigo QR dentro del recuadro.";
    qrAnimationFrame = window.requestAnimationFrame(scanQrFrame);
  } catch (error) {
    qrStatus.textContent =
      "No se pudo abrir la camara para leer el QR. Revisa los permisos del navegador.";
    stopQrScanner();
  }
}

evaluateSupport();
bindArEvents();

if (startQrScanButton) {
  startQrScanButton.addEventListener("click", startQrScanner);
}

if (startArExperienceButton) {
  startArExperienceButton.addEventListener("click", mountArScene);
}

window.addEventListener("beforeunload", stopQrScanner);
