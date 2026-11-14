// Offline copy of the app. deploy.mjs replaces ea6d8cce0b1c with a hash of the built files, so every
// deploy is a new worker with its own cache: it downloads the new files, takes over, and drops the old cache.
const PREFIX = "food-plan-";
const CACHE = PREFIX + "ea6d8cce0b1c";
const SHELL = ["./", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", event => {
  // `reload` skips the HTTP cache, so a new worker never precaches the previous deploy's files.
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  // The cache list is shared with every other site on this origin: delete only this app's old ones.
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  // The app is one page: any navigation inside the scope is that page.
  const key = event.request.mode === "navigate" ? "./" : event.request;
  event.respondWith(caches.open(CACHE)
    .then(cache => cache.match(key, { ignoreSearch: true }))
    .then(hit => hit ?? fetch(event.request)));
});
