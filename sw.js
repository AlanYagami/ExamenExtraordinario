// sw.js Estrategia Only Cache
const CACHE_NAME = "mi-cache-v1";
const urlsToCache = ["/", "/index.html", "/app.js   "];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si la respuesta está en caché, devolverla
      if (response) {
        return response;
      }
      // Si no está en caché, hacer la solicitud de red
      return fetch(event.request);
    })
  );
});
