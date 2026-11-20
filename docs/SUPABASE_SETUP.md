# Σύνδεση με Supabase (Φάση 3)

Όλος ο κώδικας του CMS είναι έτοιμος και δοκιμασμένος σε τοπική PostgreSQL (42 έλεγχοι ασφαλείας και
17 έλεγχοι λειτουργίας σε «Supabase mode»). Μένει η δημιουργία του πραγματικού project. Δύο τρόποι:

- **Α. Αυτόματα από τον Claude:** προσθέστε ένα Supabase *Personal Access Token* ως network secret για τον host
  `api.supabase.com` στις ρυθμίσεις του cloud environment και ζητήστε «σύνδεσε το Supabase».
- **Β. Χειροκίνητα**, με τα παρακάτω βήματα (~15 λεπτά).

## 1. Νέο project
1. https://supabase.com/dashboard → **New project**.
2. Όνομα: `atelier-studio` · Region: **Central EU (Frankfurt)** · ισχυρός κωδικός βάσης (φυλάξτε τον).

## 2. Βάση δεδομένων
**SQL Editor → New query**. Εκτελέστε **με αυτή τη σειρά** το περιεχόμενο των αρχείων:
1. `supabase/migrations/20261120000001_schema.sql`
2. `supabase/migrations/20261120000002_policies.sql`
3. `supabase/migrations/20261120000003_storage.sql`
4. (προαιρετικά) `supabase/seed.sql`: τα ενδεικτικά έργα/κείμενα, για να μη φαίνεται άδειος ο ιστότοπος.

> **Μην** εκτελέσετε τα αρχεία του φακέλου `supabase/tests/`: είναι μόνο για τοπικές δοκιμές.

Εναλλακτικά με το Supabase CLI: `supabase link --project-ref <ref>` και `supabase db push`.

## 3. Authentication (καμία δημόσια εγγραφή)
**Authentication → Sign In / Providers → Email**:
- **Allow new users to sign up: OFF**
- Email provider: ON · Confirm email: ON
- Minimum password length: **10**

**Authentication → URL Configuration**:
- Site URL: η διεύθυνση του ιστότοπου (π.χ. `https://www.example.gr`)
- Redirect URLs: `https://www.example.gr/diaxeirisi/neos-kodikos` (και `http://localhost:5173/diaxeirisi/neos-kodikos` για ανάπτυξη)

**Authentication → Email Templates**: μεταφράστε στα ελληνικά τα «Invite user» και «Reset password».

## 4. Μοναδική διαχειρίστρια
1. **Authentication → Users → Invite user** → email της αρχιτέκτονα. Ο σύνδεσμος της πρόσκλησης
   την οδηγεί στο `/diaxeirisi/neos-kodikos` για να ορίσει η ίδια κωδικό.
2. **SQL Editor**, δίνει δικαίωμα διαχείρισης (επιτρέπεται **μόνο ένας** διαχειριστής):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL-ΑΡΧΙΤΕΚΤΟΝΑ';
   ```

## 5. Storage
Το migration 3 δημιουργεί το δημόσιο bucket `media` (εικόνες έως 15 MB) με πολιτικές ώστε μόνο η
διαχειρίστρια να ανεβάζει/διαγράφει. Επιβεβαιώστε ότι υπάρχει στο **Storage**.

## 6. Ρύθμιση ιστότοπου
**Settings → API** → αντιγράψτε *Project URL* και *anon public key* σε αρχείο `.env` (δείτε `.env.example`):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
`npm run build` → ανεβάστε τον φάκελο `dist/` στο hosting.
Το anon key είναι σχεδιασμένο να είναι δημόσιο· την ασφάλεια την εξασφαλίζουν οι κανόνες RLS.
**Ποτέ** μην βάλετε το `service_role` key στον ιστότοπο.

## 7. Έλεγχος
- `/erga` εμφανίζει τα έργα από τη βάση.
- Υποβολή αιτήματος → εμφανίζεται στο `/diaxeirisi/aitimata`.
- Σύνδεση στο `/diaxeirisi` → δημιουργία έργου → ανέβασμα φωτογραφίας → δημοσίευση.

## Ασφάλεια (σύνοψη)
| Πόρος | Επισκέπτης | Συνδεδεμένος μη-διαχειριστής | Διαχειρίστρια |
|---|---|---|---|
| Δημοσιευμένα έργα, κατηγορίες, υπηρεσίες, σελίδες, ρυθμίσεις | ανάγνωση | ανάγνωση | πλήρης |
| Πρόχειρα έργα | — | — | πλήρης |
| Αιτήματα προσφοράς | μόνο υποβολή μέσω `submit_quote_request` (έλεγχος πεδίων, honeypot, όριο 3/ώρα/email, 20/10′ συνολικά) | — | ανάγνωση/ενημέρωση/διαγραφή |
| Αρχεία `media` | ανάγνωση μέσω δημόσιου URL | — | ανέβασμα/διαγραφή |
| Πίνακας `admins` | — | μόνο τη δική του γραμμή | μόνο τη δική της γραμμή (αλλαγές μόνο από SQL) |

Τοπικές δοκιμές βάσης: `PGHOST=/tmp/pgtest PGPORT=54329 ./scripts/test-db.sh`
