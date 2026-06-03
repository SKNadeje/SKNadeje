// WC2026 Tipovačka - Service Worker
const CACHE_NAME = 'wc2026-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './logo-wc2026.png',
    './messi.jpg',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap'
];

// Instalace - cache základních souborů
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE).catch(err => console.warn('Cache miss:', err)))
    );
    self.skipWaiting();
});

// Aktivace - smaž starou cache
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch - network first, fallback na cache
self.addEventListener('fetch', event => {
    // Supabase requesty NEPACHUJ (musí být live)
    if (event.request.url.includes('supabase.co') || event.request.url.includes('supabase.io')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache jen úspěšné odpovědi
                if (response && response.status === 200 && event.request.method === 'GET') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
