# DS Architect: Αρχιτεκτονική & Εσωτερικοί Χώροι

Ιστότοπος portfolio με ιδιωτικό CMS.
React 19 · TypeScript · Vite · Tailwind CSS v4 · GSAP + ScrollTrigger · React Router · Supabase.

```bash
npm install
npm run dev              # http://localhost:5173
npm run build:static     # production: build + prerender (VITE_SITE_URL=https://…)
npm run serve            # τοπικός έλεγχος του dist/ όπως σε hosting
```

| Τεκμηρίωση | |
|---|---|
| Design system (διαβάστε πριν από οπτικές αλλαγές) | `design-system/atelier-studio/MASTER.md` |
| Αρχιτεκτονική & CMS | `docs/ARCHITECTURE.md` |
| Σύνδεση Supabase | `docs/SUPABASE_SETUP.md` |
| Δημοσίευση (Railway) | `docs/DEPLOYMENT.md` |

## Έλεγχοι
```bash
npm run test:unit          # επικύρωση, slugs, εικόνες
npm run test:e2e           # Playwright: ιστότοπος (prerendered) + CMS επίδειξης
npm run test:db            # RLS/RPC σε PostgreSQL (PGHOST/PGPORT/PGUSER/PGPASSWORD)
npm run test:supabase-mode # ιστότοπος σε Supabase mode με πραγματική βάση
```
Τρέχουν αυτόματα στο GitHub Actions (`.github/workflows/ci.yml`).

Όλο το περιεχόμενο και οι φωτογραφίες είναι **προσωρινά** (βλ. `assets-src/photos/SOURCES.md`).
