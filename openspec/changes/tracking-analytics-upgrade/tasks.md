## 1. Bugfixes — Corriger les problemes existants

- [x] 1.1 Heartbeat ne incremente plus pageViews — seulement lastActiveAt et exitPath
- [x] 1.2 Deduplication via Set de 10K IDs + pageViews incremente via event_api (page_view events)
- [x] 1.3 Validation: isValidEvent verifie id, type, sessionId, path, timestamp

## 2. Duration — Mesurer le temps passe par page

- [x] 2.1 pageEnterTime stocke via performance.now() — reset a chaque trackPageView
- [x] 2.2 trackPageView envoie duration de la page precedente dans metadata.duration (secondes)
- [x] 2.3 handleUnload appelle sendCurrentPageDuration avant flush
- [x] 2.4 getAvgTimeOnPage(path) ajoute dans tracking-store — moyenne des metadata.duration

## 3. Entity Views — Tracker les vues de services/formations/profils

- [x] 3.1 Hook useEntityTracker cree — dedup par session via Set dans tracker
- [x] 3.2 Service detail page: useEntityTracker("service", service?.id)
- [x] 3.3 Profil freelance page: useEntityTracker("profile", freelancer?.id)
- [x] 3.4 Formation pages (2 fichiers): useEntityTracker("formation", formation?.id)

## 4. Conversions — Tracker les commandes

- [x] 4.1 trackConversion() cree dans tracking-store — insere l'event server-side
- [x] 4.2 trackConversion("order_placed") appele dans POST /api/orders (dev + prod)
- [x] 4.3 getConversionRate(serviceId) ajoute — retourne { views, orders, rate }

## 5. Stats API — Enrichir les calculs business

- [x] 5.1 Stats API enrichie — getAvgTimeOnPage + getConversionRate disponibles
- [x] 5.2 Cree GET /api/tracking/service-stats/[id] — retourne views, avgTimeOnPage, orders, conversionRate

## 6. Dashboard Integration — Connecter au frontend

- [x] 6.1 Admin analytics page appelle /api/tracking/stats — section "Trafic en temps reel" ajoutee (visiteurs, sessions, pages vues, sessions actives, rebond, appareils, top pages)
- [x] 6.2 Service-stats endpoint disponible pour le dashboard freelance via /api/tracking/service-stats/[id]

## 7. Verification

- [x] 7.1 Heartbeat: pageViews n'est plus incremente — seulement lastActiveAt + exitPath
- [x] 7.2 Deduplication: Set de 10K IDs + validation isValidEvent
- [x] 7.3 Duration: sendCurrentPageDuration() appele dans trackPageView + handleUnload
- [x] 7.4 service_viewed: useEntityTracker dans /services/[slug] avec dedup session
- [x] 7.5 Dashboard admin: section "Trafic en temps reel" chargee depuis /api/tracking/stats
