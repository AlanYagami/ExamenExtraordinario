// Referencias a elementos del DOM
const $ = (selector) => document.querySelector(selector);

const permisoSpan = $("#permiso");
const latSpan = $("#lat");
const lngSpan = $("#lng");
const accSpan = $("#acc");
const timestampSpan = $("#timestamp");
const mensajeP = $("#mensaje");
const linkMaps = $("#link-maps");
const btnDetener = $("#btn-detener");
const takePhotoBtn = document.getElementById("takePhoto");

let watchId = null;

// Mostrar estado inicial de permisos si está disponible
if ("permissions" in navigator && navigator.permissions.query) {
  navigator.permissions
    .query({ name: "geolocation" })
    .then((result) => {
      permisoSpan.textContent = result.state;
      result.onchange = () => {
        permisoSpan.textContent = result.state;
      };
    })
    .catch(() => {
      permisoSpan.textContent = "no disponible (permissions API)";
    });
} else {
  permisoSpan.textContent = "desconocido (sin Permissions API)";
}

// Función para formatear fecha/hora
function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString();
}

// Función que maneja posición exitosa
function onPositionSuccess(position) {
  const { latitude, longitude, accuracy } = position.coords;

  latSpan.textContent = latitude.toFixed(6);
  lngSpan.textContent = longitude.toFixed(6);
  accSpan.textContent = accuracy.toFixed(2);
  timestampSpan.textContent = formatTimestamp(position.timestamp);

  mensajeP.textContent = "Ubicación actualizada correctamente.";

  // Mostrar link a mapas (Google Maps)
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  linkMaps.href = url;
  linkMaps.style.display = "inline-block";
}

// Función que maneja errores de geolocalización
function onPositionError(error) {
  console.error(error);
  switch (error.code) {
    case error.PERMISSION_DENIED:
      mensajeP.textContent =
        "Permiso denegado. Revisa la configuración del navegador.";
      break;
    case error.POSITION_UNAVAILABLE:
      mensajeP.textContent = "La ubicación no está disponible.";
      break;
    case error.TIMEOUT:
      mensajeP.textContent = "La solicitud de ubicación tardó demasiado.";
      break;
    default:
      mensajeP.textContent = "Ocurrió un error al obtener la ubicación.";
  }
}

// Opciones de la Geolocation API
const geoOptions = {
  enableHighAccuracy: true, // Intentar usar GPS cuando sea posible
  timeout: 10000, // Máximo 10s de espera
  maximumAge: 0, // No usar ubicaciones cacheadas
};

// Evento: al hacer clic en "Obtener / Ver ubicación"
takePhotoBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    mensajeP.textContent = "Este navegador no soporta Geolocation API.";
    return;
  }

  mensajeP.textContent = "Obteniendo ubicación...";

  // Primero, obtener una sola posición

  // Luego, iniciar seguimiento continuo
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(
      onPositionSuccess,
      onPositionError,
      geoOptions
    );
    btnDetener.disabled = false;
    mensajeP.textContent = "Seguimiento de ubicación iniciado.";
  }
});

// Evento: al hacer clic en "Detener seguimiento"
btnDetener.addEventListener("click", () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    mensajeP.textContent = "Seguimiento de ubicación detenido.";
    btnDetener.disabled = true;
  }
});

// Registro básico del Service Worker (para PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("Service Worker registrado:", reg.scope))
      .catch((err) => console.error("Error al registrar SW:", err));
  });
}

// Referencias a elementos del DOM
const openCameraBtn = document.getElementById("openCamera");
const cameraContainer = document.getElementById("cameraContainer");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const photosGallery = document.getElementById("photosGallery");
const photosContainer = document.getElementById("photosContainer");

// Variable global para almacenar el MediaStream
let stream = null;
let photoCount = 0;
let currentFacingMode = "environment"; // 'environment' = trasera, 'user' = frontal

// Detectar orientación del dispositivo
function getVideoConstraints() {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    return {
      facingMode: { ideal: currentFacingMode },
      width: { ideal: 720 },
      height: { ideal: 1280 },
    };
  } else {
    return {
      facingMode: { ideal: currentFacingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  }
}

// Función para abrir la cámara
async function openCamera() {
  try {
    // Definición de restricciones (constraints)
    const constraints = {
      video: getVideoConstraints(),
    };

    // Obtener el Stream de Medios
    stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Obtener las dimensiones reales del video
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    // Ajustar el canvas al tamaño del video
    canvas.width = settings.width;
    canvas.height = settings.height;

    // Asignar el Stream al elemento video
    video.srcObject = stream;

    // Actualización de la UI
    cameraContainer.style.display = "block";
    openCameraBtn.textContent = "Cámara Abierta";
    openCameraBtn.disabled = true;

    console.log("Cámara abierta exitosamente");
    console.log("Resolución:", settings.width, "x", settings.height);
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
    alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
  }
}

// Función para tomar una foto
function takePhoto() {
  if (!stream) {
    alert("Primero debes abrir la cámara");
    return;
  }

  // Dibujar el frame actual del video en el canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convertir el canvas a Data URL
  const imageDataURL = canvas.toDataURL("image/png");

  // Incrementar contador de fotos
  photoCount++;

  // Crear elemento de foto
  const photoItem = document.createElement("div");
  photoItem.className = "photo-item";

  const img = document.createElement("img");
  img.src = imageDataURL;
  img.alt = `Foto ${photoCount}`;

  photoItem.appendChild(img);

  // Agregar la foto a la galería

  // Mostrar la foto en el modal
  document.getElementById("capturedPhoto").src = imageDataURL;

  // Abrir el modal
  openModal();

  navigator.geolocation.getCurrentPosition(
    onPositionSuccess,
    onPositionError,
    geoOptions
  );

  // Mostrar información en consola
  console.log("Foto capturada:", photoCount);
  console.log("Tamaño en Base64:", imageDataURL.length, "caracteres");
}

// Función para cambiar entre cámara frontal y trasera
async function switchCamera() {
  // Cambiar el modo de cámara
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";

  // Cerrar la cámara actual
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Abrir la cámara con el nuevo modo
  await openCamera();
}

// Event Listeners
openCameraBtn.addEventListener("click", openCamera);
takePhotoBtn.addEventListener("click", takePhoto);

// Event listener para cerrar el modal
document.getElementById("closeModal").addEventListener("click", () => {
  const modal = document.getElementById("photoModal");
  modal.style.display = "none";
});

// Limpiar stream cuando el usuario cierra la página
window.addEventListener("beforeunload", () => {
  closeCamera();
});

console.log("PWA Cámara inicializada");

// Abrir el modal despues de tomar la foto
function openModal() {
  const modal = document.getElementById("photoModal");
  modal.style.display = "block";
  // Detener todos los tracks del stream
  stream.getTracks().forEach((track) => track.stop());
  stream = null;

  // Limpiar y ocultar UI
  video.srcObject = null;
  cameraContainer.style.display = "none";

  // Restaurar el botón
  openCameraBtn.textContent = "Abrir Cámara";
  openCameraBtn.disabled = false;
}
