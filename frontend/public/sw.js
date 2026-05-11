const CACHE_NAME = 'techsolutions-shell-v1'
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

const FALLBACK_HTML = `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TechSolutions sin conexion</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f1f5f9;
        color: #0f172a;
      }
      main {
        width: min(90vw, 420px);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #ffffff;
        padding: 24px;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }
      h1 { margin: 0 0 8px; font-size: 22px; }
      p { margin: 0; color: #475569; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <h1>Sin conexion</h1>
      <p>TechSolutions necesita internet para consultar datos actualizados. Revisa tu conexion e intenta de nuevo.</p>
    </main>
  </body>
</html>
`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copia = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copia))
          return response
        })
        .catch(async () => {
          return (await caches.match('/')) || new Response(FALLBACK_HTML, {
            headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          })
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cacheResponse) => {
      if (cacheResponse) return cacheResponse

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response

        const copia = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia))
        return response
      })
    }),
  )
})
