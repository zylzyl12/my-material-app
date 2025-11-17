// 定义缓存名称和版本
const CACHE_NAME = 'material-management-v1.0.0';

// 需要缓存的资源列表
const urlsToCache = [
  './',
  './material-management.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存资源:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('所有资源已缓存');
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 已激活');
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 使用缓存或网络
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，返回缓存内容
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request).then(response => {
          // 检查是否收到有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 克隆响应（因为响应是流，只能使用一次）
          const responseToCache = response.clone();
          
          // 将新资源添加到缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // 网络和缓存都失败时的处理
        // 可以返回一个自定义的离线页面
        console.log('网络请求失败，使用缓存');
      })
  );
});