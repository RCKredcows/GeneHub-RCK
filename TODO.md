# TODO

## 1. Stale shell serves 404s for its own assets

**Status:** open. A fix was drafted and reverted; `frontend/nginx.conf` and
`frontend/public/sw.js` are back to the state that produces the bug.

### Symptom

After a deploy, a subdomain half-loads and the console shows:

```
GET /assets/index-DDh0_e4M.js  404 (nginx)
```

The hash names a bundle from a previous build. It affects one subdomain at a
time — `bar7` broke while `rck` was fine — because browser and service worker
caches are per-origin, so each subdomain goes stale independently.

### Two contributing causes

**nginx serves the shell with no cache directive.**

```nginx
location = /index.html { add_header Cache-Control "...must-revalidate"; }
```

`location = ` is an *exact* URI match. Browsers request `/`, not `/index.html`,
so that block never fires. The shell falls through to `location /`, which sets
no `Cache-Control` at all, and browsers heuristically cache uncached HTML. A
stale shell references hashed bundles that no longer exist on the server.

**The service worker pins the shell indefinitely.** `sw.js` precaches `/` and
`/index.html`, with hardcoded `genehub-v1` / `genehub-static-v1` names. The
`activate` handler deletes caches *not* in that list, so with constant names
nothing is ever evicted. The `fetch` handler also stores every 200 response,
including HTML, so a navigation re-poisons the cache.

### Decision: the offline capability is not real, so stop pretending

Established 2026-07-29. The service worker excludes every data request:

```js
if (request.url.includes('supabase.co')) return;
```

and React Query has no persister, so its cache is in memory and dies on reload.
Offline you get the shell and nothing else — every screen renders empty. Nobody
can look up a straw, a tank, or a customer. `OfflineBanner` only reads
`navigator.onLine` and displays a message; it enables nothing.

Caching `/assets/` also duplicates nginx, which already serves them
`immutable, max-age=31536000`. The worker's copy is strictly worse, and it is
what 404'd Bar 7.

The worker's one remaining job is **installability**: Chrome wants a fetch
handler before offering the install prompt. iOS does not — Add to Home Screen
works from the manifest alone.

### Fix

1. **nginx:** move the no-cache header onto `location /`, the block that
   actually serves the shell. **Needed regardless of the worker** — browsers
   heuristically cache uncached HTML on their own.
2. **sw.js:** reduce to a minimal pass-through — a `fetch` listener that does
   not call `respondWith`, no precache, no use of the Cache API. Keeps the
   install prompt, removes the entire stale-shell bug class.
3. Delete the now-unused `CACHE_NAME` / `STATIC_CACHE` / `STATIC_ASSETS` and the
   activate-time cleanup — but **bump the cache name once first**, so devices
   already holding a poisoned `genehub-static-v1` purge it on activate. Without
   that, existing installs stay broken.

Do not build per-build cache names. That solves a problem this app does not have.

### Verifying

```bash
curl -sSI https://rck.daltongorham.com/ | grep -i cache-control
curl -sSI https://rck.daltongorham.com/assets/<file>.js | grep -i cache-control
```

Shell must revalidate; hashed assets must stay immutable. Then deploy twice and
confirm a normal reload picks up the second build without a hard refresh — in a
window that already has a service worker registered, since a private window
hides the bug.

### If offline is ever wanted for real

It is a feature, not a fix: persist React Query to IndexedDB, deliberately cache
Supabase GETs, and decide what happens to writes made offline. Plausible for
barn use with poor signal — but nothing in the current implementation is a step
towards it.

---

## 2. Redesign the landing page

**File:** `frontend/src/pages/Landing/index.tsx`

Built as a functional placeholder: it borrows `../Login/styles.css` and carries
a pile of inline `style={{...}}` objects, which is neither reusable nor
consistent with the rest of the app.

Use the **frontend-design skill** to give it an intentional visual direction
rather than defaults, and modernise it.

### What it has to keep doing

- Operation name auto-derives the subdomain until the user edits it
- Live availability check against `is_slug_available` (400ms debounce), with
  inline feedback: checking / available / unavailable
- The `.daltongorham.com` suffix shown adjacent to the address field
- Submit disabled until the address is confirmed available
- Per-error-code messages from `create_tenant_with_owner` (`slug_taken`,
  `reserved_slug`, `email_taken`, …)
- On success, redirect to `<slug>.<domain>/signup?email=…`

### Worth addressing in the redesign

- Replace inline styles with a real stylesheet, matching the BEM-ish convention
  the rest of the app uses (`login__field`, `login__input`, …)
- It is the **first thing a prospective customer sees** and currently reads as a
  bare form. It needs enough framing to explain what GeneHub is.
- Mobile layout is untested; the address field plus its domain suffix is the
  part most likely to overflow
- Dark mode: the app supports it via `data-theme`, and the inline colours
  (`#666`, `#1a7f37`, `#b42318`) ignore it
- The availability indicator shifts layout as it appears — reserve the space
- No loading state on the availability check beyond the word "Checking…"
