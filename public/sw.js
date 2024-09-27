import {
    del,
    entries
} from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

// Cache app shell
const filesToCache = [
    "/",
    "manifest.json",
    "index.html",
    "offline.html",
    "404.html",
    "/assets/site.css",
    "app.js",
    "favicon.ico",
    "/assets/img/default_img.jpg",
    "/records",
    "/assets/img/ss.png",
    "/assets/img/ios/144.png",
    "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm"
];

const staticCacheName = "static-cache-v1"
const dynamicCacheName = "dynamic-cache"

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});


self.addEventListener("activate", (event) => {
    const cacheWhitelist = [staticCacheName];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    return self.clients.claim();
});


self.addEventListener("fetch", (event) => {
    console.log("fetch: " + event.request.url)

    event.respondWith(
        // Try the network
        fetch(event.request)
          .then(async (res) => {
            const cache = await caches.open(dynamicCacheName);
              // Put in cache if succeeds
              // Cache only full data (status code 200) - do not try to cache partial response (status code 206)
              if (res.status === 200) {
                  cache.put(event.request.url, res.clone());
              }
              return res;
          })
          .catch(function(err) {
              // Fallback to cache
              const res = caches.match(event.request);
              if (res === undefined) {
                  // get and return the offline page
                  return caches.match("offline.html");
              }
              return res;
          })
      );

    // event.respondWith(
    //     caches
    //         .match(event.request)
    //         .then((response) => {
    //             if (response) {
    //                 console.log("Found " + event.request.url + " in cache")
    //                 return response;
    //             }
                
    //             return fetch(event.request).then((response) => {

    //                 if (response.status === 404) {
    //                     return caches.match("404.html");
    //                 }

    //                 return caches.open(dynamicCacheName).then((cache) => {
                        
    //                     // Cache only full data (status code 200) - do not try to cache partial response (status code 206)
    //                     if(response.status === 200) {
    //                         cache.put(event.request.url, response.clone());
    //                     }
    //                     return response;
    //                 });
    //             });
    //         })
    //         .catch((error) => {
    //             console.log("Error", event.request.url, error);
                
    //             return caches.match("offline.html");
    //         })
    // );
});


self.addEventListener('sync', function (event) {
    console.log('Background sync!', event);
    if (event.tag === 'sync-songs') {
        event.waitUntil(
            syncSongs()
        );
    }
});

let syncSongs = async function () {
    entries()
        .then((entries) => {
            entries.forEach((entry) => {
                let data = entry[1]; //  Each entry is an array of [key, value].

                let songFormData = new FormData();
                let imgFormData = new FormData();


                songFormData.append('title', data.title);
                songFormData.append('author', data.author);
                songFormData.append('album', data.album);
                songFormData.append('song', data.song);

                imgFormData.append('title', data.title);
                imgFormData.append('author', data.author);
                imgFormData.append('album', data.album);
                imgFormData.append('image', data.image);

                fetch('/saveSong', {
                        method: 'POST',
                        body: songFormData
                    })
                    .then(function (res) {
                        if (res.ok) {
                            //OK
                        } else {
                            console.log(res);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

                    fetch('/saveImg', {
                        method: 'POST',
                        body: imgFormData
                    })
                    .then(function (res) {
                        if (res.ok) {
                            res.json()
                                .then(function (data) {
                                    console.log("Deleting from idb:", data.title);
                                    del(data.title);
                                });
                        } else {
                            console.log(res);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            })
        });
}