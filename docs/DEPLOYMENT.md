# Δημοσίευση στο Railway

Ο ιστότοπος είναι έτοιμος για Railway: `Dockerfile` (build + prerender, μετά Caddy), `railway.json`
(health check), `deploy/Caddyfile` (routing, συμπίεση, κεφαλίδες ασφαλείας/cache).
Δεν απαιτείται καμία ρύθμιση build/start command στο Railway: τα διαβάζει από το repository.

## 1. Repository
Ανεβάστε τον κώδικα σε GitHub repository (ιδιωτικό ή δημόσιο).

## 2. Νέο service στο Railway (στον λογαριασμό όπου θα φιλοξενηθεί)
1. **New Project → Deploy from GitHub repo** → επιλέξτε το repository.
2. Το Railway εντοπίζει το `railway.json` και χτίζει με το `Dockerfile`.

## 3. Variables (Service → Variables)
Είναι **μεταβλητές build**: ενσωματώνονται στον κώδικα κατά το build. Μετά από κάθε αλλαγή: **Redeploy**.

| Μεταβλητή | Παράδειγμα | Απαιτείται |
|---|---|---|
| `VITE_SITE_URL` | `https://www.example.gr` | Ναι (canonical URLs, Open Graph, sitemap) |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Για το CMS (Φάση 3) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ…` (anon public key) | Για το CMS (Φάση 3) |

Χωρίς τα στοιχεία Supabase ο ιστότοπος λειτουργεί με το στατικό περιεχόμενο και η διαχείριση εμφανίζεται ως ανενεργή.
**Ποτέ** μη βάλετε το `service_role` key.

## 4. Domain
1. **Settings → Networking → Generate Domain** (για δοκιμή) ή **Custom Domain** (π.χ. `www.example.gr`).
2. Στον πάροχο του domain, προσθέστε το CNAME που δείχνει το Railway. Το HTTPS ενεργοποιείται αυτόματα.
3. Ορίστε `VITE_SITE_URL` στο τελικό domain και κάντε **Redeploy**.

## 5. Supabase (όταν συνδεθεί το CMS)
Authentication → URL Configuration:
- Site URL: `https://www.example.gr`
- Redirect URL: `https://www.example.gr/diaxeirisi/neos-kodikos`

(Αναλυτικά: `docs/SUPABASE_SETUP.md`.)

## 6. Νέα έργα και SEO
Οι σελίδες προ-αποδίδονται (prerender) κατά το build, ώστε μηχανές αναζήτησης και προεπισκοπήσεις
συνδέσμων (Facebook, LinkedIn, Viber) να βλέπουν περιεχόμενο. Ένα νέο έργο από το CMS εμφανίζεται
**αμέσως** στον ιστότοπο· για να μπει και στο `sitemap.xml` / στο στατικό HTML, πατήστε **Redeploy**
μετά από μεγάλες αλλαγές (ή προγραμματίστε ένα εβδομαδιαίο redeploy).

## 7. Μετά την πρώτη δημοσίευση
- [ ] `https://…/healthz` επιστρέφει `ok`
- [ ] Google Search Console: προσθήκη ιδιοκτησίας, υποβολή `https://…/sitemap.xml`
- [ ] Έλεγχος προεπισκόπησης συνδέσμου (π.χ. Facebook Sharing Debugger)
- [ ] Αντικατάσταση ενδεικτικών φωτογραφιών/κειμένων με πραγματικά (μέσω CMS)
- [ ] Τελικό κείμενο Πολιτικής Απορρήτου (νομικός έλεγχος)

## Τι κάνει ο server (Caddy)
| Θέμα | Ρύθμιση |
|---|---|
| Routing | αρχείο → `<διαδρομή>/index.html` (prerendered) → `spa.html` |
| Συμπίεση | zstd / gzip |
| Cache | `/assets/*` 1 έτος (immutable, hashed) · `/images/*` 30 ημέρες · HTML πάντα επανέλεγχος |
| Ασφάλεια | CSP (μόνο ίδιο origin + Supabase), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| Διαχείριση | `X-Robots-Tag: noindex` στο `/diaxeirisi` |
| Health check | `/healthz` |

> Αν αργότερα χρησιμοποιηθεί custom domain και για το Supabase, προσθέστε το στις οδηγίες
> `img-src` / `connect-src` του CSP στο `deploy/Caddyfile`.

## Άλλα hosting (εναλλακτικά)
Ο φάκελος `dist/` (από `VITE_SITE_URL=… npm run build:static`) δουλεύει σε οποιονδήποτε στατικό host:
`public/_redirects` (Netlify / Cloudflare Pages) και `public/.htaccess` (Apache) περιλαμβάνονται.
Οποιοδήποτε Docker host μπορεί να χρησιμοποιήσει το ίδιο `Dockerfile`.

## Τοπικός έλεγχος production build
```bash
VITE_SITE_URL=http://localhost:4173 npm run build:static
npm run serve
```
