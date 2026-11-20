/** Concatenates supabase/migrations/*.sql + supabase/seed.sql into supabase/setup-all.sql (one paste in the SQL Editor). */
import { readdir, readFile, writeFile } from 'node:fs/promises'

const parts = ['-- DS Architect: πλήρης εγκατάσταση βάσης για Supabase (εκτελέστε ΜΙΑ φορά στο SQL Editor).\n-- Παράγεται από: npm run supabase:bundle\n']
for (const f of (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  parts.push(`\n-- ===================== supabase/migrations/${f} =====================\n${await readFile(`supabase/migrations/${f}`, 'utf8')}`)
}
parts.push(`\n-- ===================== supabase/seed.sql =====================\n${await readFile('supabase/seed.sql', 'utf8')}`)
await writeFile('supabase/setup-all.sql', parts.join(''))
console.log('supabase/setup-all.sql written')
