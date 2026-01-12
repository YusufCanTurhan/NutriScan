// service-worker.js - Offline Mod ve Akıllı Cache
const CACHE_NAME = "nutriscan-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./products.html",
  "./detail.html",
  "./compare.html",
  "./list.html",
  "./about.html",
  "./contact.html",
  "./css/style.css",
  "./js/app.js",
  "./js/products.js",
  "./js/detail.js",
  "./js/compare.js",
  "./js/list.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
  "https://unpkg.com/html5-qrcode",
  "https://fonts.googleapis.com/icon?family=Material+Icons+Round"
];

// 1. Kurulum: Dosyaları Önbelleğe Al
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Dosyalar önbelleğe alınıyor...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktifleştirme: Eski Cache'leri Temizle
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Eski cache silindi:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. İstekleri Yakala (Fetch Strategy)
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // A) API İstekleri (OpenFoodFacts) -> Network First, sonra Cache
  // İnternet varsa yenisini çek, yoksa eskisine bak.
  if (url.origin.includes("openfoodfacts.org")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Başarılı yanıtı klonlayıp cache'e atalım
          const resClone = res.clone();
          caches.open("nutriscan-api").then((cache) => {
            cache.put(e.request, resClone);
          });
          return res;
        })
        .catch(() => {
          // İnternet yoksa cache'den dön
          return caches.match(e.request);
        })
    );
    return;
  }

  // B) Resimler ve Diğer Dosyalar -> Cache First, sonra Network
  // Hız için önce cache'e bak, yoksa internetten çek.
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((networkRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
           // Dinamik olarak yeni gezilen sayfaları da cache'le
           cache.put(e.request, networkRes.clone());
           return networkRes;
        });
      });
    }).catch(() => {
      // Eğer hem internet yok hem cache yoksa (Offline sayfası opsiyonel)
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html'); 
      }
    })
  );
});