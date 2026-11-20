/**
 * Integration test: the site built in Supabase mode (fake project URL) talks to a REAL Postgres
 * (migrations + seed from scripts/test-db.sh). Supabase REST/RPC calls are answered by SQL running
 * as role `anon`, so RLS and submit_quote_request() are exercised for real.
 *   npm run test:supabase-mode   (needs Postgres via PGHOST/PGPORT/PGUSER/PGPASSWORD)
 */
/* Serves the Supabase-mode build; answers Supabase REST/RPC calls from the local Postgres, as role anon (RLS applies). */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const out = process.argv[2] ?? 'test-results';
const PG = ['-h', process.env.PGHOST ?? '/tmp/pgtest', '-p', process.env.PGPORT ?? '54329', '-U', process.env.PGUSER ?? 'postgres', '-d', process.env.PGDATABASE ?? 'atelier_test'];
const sql = (q) => execFileSync('psql', [...PG, '-qtAX', '-v', 'ON_ERROR_STOP=1', '-c', `set role anon; set request.jwt.claims = '{"role":"anon"}';\n${q}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;
const calls = [];
const results = []; const check = (n, ok, x = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);

async function handle(route) {
  const req = route.request(); const url = new URL(req.url());
  const m = url.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
  if (!m) return route.fulfill({ status: 404, body: '{}' });
  calls.push(`${req.method()} ${url.pathname}${url.search}`);
  const headers = { 'content-type': 'application/json' };
  if (m[1]) {
    const body = req.postDataJSON() || {};
    try {
      const arg = body.payload !== undefined ? `${lit(JSON.stringify(body.payload))}::jsonb` : '';
      const res = sql(`select coalesce(to_json(public.${m[2]}(${arg})), 'null'::json);`);
      return route.fulfill({ status: 200, headers, body: res });
    } catch (e) {
      const msg = (e.stderr || '').match(/ERROR:\s+(.*)/)?.[1] ?? 'error';
      return route.fulfill({ status: 400, headers, body: JSON.stringify({ code: 'P0001', message: msg, details: null, hint: null }) });
    }
  }
  const table = m[2];
  const where = [];
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    if (op === 'eq') where.push(`${k} = ${lit(val)}`);
    if (op === 'like') where.push(`${k} like ${lit(val.replace(/\*/g, '%'))}`);
  }
  const order = url.searchParams.get('order')?.split('.')[0];
  const select = url.searchParams.get('select') || '';
  // Like real PostgREST: projects↔project_images has two FKs, so an embed without a hint is ambiguous (HTTP 300).
  if (table === 'projects' && /project_images\(/.test(select) && !/project_images!/.test(select)) {
    return route.fulfill({ status: 300, headers, body: JSON.stringify({ code: 'PGRST201', message: 'Could not embed because more than one relationship was found' }) });
  }
  const embed = /project_images/.test(select);
  const cols = embed ? `t.*, (select coalesce(json_agg(i order by i.sort_order), '[]') from public.project_images i where i.project_id = t.id) as project_images` : 't.*';
  const rows = JSON.parse(sql(`select coalesce(json_agg(x), '[]') from (select ${cols} from public.${table} t ${where.length ? 'where ' + where.join(' and ') : ''} ${order ? 'order by ' + order : ''}) x;`));
  if ((req.headers()['accept'] || '').includes('vnd.pgrst.object')) {
    if (rows.length !== 1) return route.fulfill({ status: 406, headers, body: JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows`, hint: null }) });
    return route.fulfill({ status: 200, headers, body: JSON.stringify(rows[0]) });
  }
  return route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
}

(async () => {
  const b = await chromium.launch(); const errors = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('https://fake-project.supabase.co/**', handle);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/406|400/.test(m.text()) && errors.push(m.text()));
  const B = process.env.BASE_URL ?? 'http://localhost:4174';
  try {
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const g = await p.$$eval('[data-g-item] h3', (els) => els.map((e) => e.textContent));
    check('home: featured projects from DB (5, ordered)', g.length === 5 && g[0] === 'Οικία του Ορίζοντα', JSON.stringify(g));
    check('home: services from DB (4)', (await p.locator('#ypiresies ul li').count()) === 4);
    check('supabase-js loaded lazily (calls made)', calls.some((c) => c.includes('/rest/v1/projects')), calls[0]);
    await p.goto(B + '/erga', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    check('projects page: 8 cards from DB', (await p.locator('article[aria-labelledby^="card-"]').count()) === 8);
    await p.goto(B + '/erga/oikia-kato-apo-ta-dentra', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    check('project detail from DB', (await p.textContent('h1')) === 'Οικία κάτω από τα Δέντρα');
    check('project gallery images resolved (local: paths → bundled AVIF/WebP)', await p.evaluate(() => [...document.querySelectorAll('figure img')].some((i) => i.naturalWidth > 0 && /house-under-tree|timber-house-garden/.test(i.currentSrc))));
    check('next project link from DB', (await p.textContent('[data-next] a')).includes('Γραφεία με Φως'));
    await p.goto(B + '/erga/den-yparxei', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('unknown slug → 404 (maybeSingle null)', (await p.textContent('h1')).includes('δεν βρέθηκε'));
    await p.goto(B + '/sxetika', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
    check('about page from page_content', (await p.textContent('body')).includes('Ένα ανεξάρτητο στούντιο αρχιτεκτονικής'));
    // Draft must not be visible: unpublish via superuser, check public
    execFileSync('psql', [...PG, '-qc', "update public.projects set status='draft' where slug='grafeia-me-fos'"]);
    await p.goto(B + '/erga/grafeia-me-fos', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('draft project not reachable publicly', (await p.textContent('h1')).includes('δεν βρέθηκε'));

    // Quote request through the real RPC
    const fill = async (email) => {
      await p.goto(B + '/aitima-prosforas', { waitUntil: 'networkidle' }); await p.waitForTimeout(700);
      await p.fill('#q-fullname', 'Ελένη Δοκιμή'); await p.fill('#q-email', email); await p.fill('#q-phone', '+30 6900000000');
      await p.fill('#q-area', 'Ηράκλειο'); await p.check('#q-type-2', { force: true }); await p.fill('#q-sqm', '120,5');
      await p.fill('#q-description', 'Σχεδιασμός εσωτερικού χώρου για διαμέρισμα 120 τ.μ.'); await p.check('#q-privacy');
      await p.click('button[type="submit"]'); await p.waitForTimeout(1500);
      return p.textContent('[role="status"]');
    };
    check('no demo/off note in Supabase mode', !(await (await p.goto(B + '/aitima-prosforas'), p.content())).includes('Σημείωση για τη δοκιμαστική έκδοση'));
    const r1 = await fill('eleni@example.gr');
    check('quote: "sent" confirmation', r1.includes('στάλθηκε') && !r1.includes('δεν στάλθηκε'), r1.slice(0, 60));
    check('quote: form cleared after success', (await p.inputValue('#q-fullname')) === '');
    const stored = execFileSync('psql', [...PG, '-qtAc', "select full_name||'|'||email||'|'||project_type||'|'||size_sqm from public.quote_requests"], { encoding: 'utf8' }).trim();
    check('quote stored in DB via RPC (as anon)', stored === 'Ελένη Δοκιμή|eleni@example.gr|interior|120.50', stored);
    await fill('eleni@example.gr'); await fill('eleni@example.gr');
    const r4 = await fill('eleni@example.gr');
    check('quote: server rate limit shown in Greek', r4.includes('πολλά αιτήματα'), r4.slice(0, 80));
    await p.screenshot({ path: out + '/sb-ratelimit.png' });
    // Honeypot: bot fills hidden field → "sent" but nothing stored
    await p.goto(B + '/aitima-prosforas', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    await p.evaluate(() => { const i = document.getElementById('q-website'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'http://spam'); i.dispatchEvent(new Event('input', { bubbles: true })) });
    await p.fill('#q-fullname', 'Bot Bot'); await p.fill('#q-email', 'bot@spam.test'); await p.fill('#q-phone', '6900000000');
    await p.fill('#q-area', 'x'); await p.check('#q-type-4', { force: true }); await p.fill('#q-description', 'spam spam spam spam spam spam'); await p.check('#q-privacy');
    await p.click('button[type="submit"]'); await p.waitForTimeout(1200);
    const bots = execFileSync('psql', [...PG, '-qtAc', "select count(*) from public.quote_requests where email='bot@spam.test'"], { encoding: 'utf8' }).trim();
    check('honeypot submission not stored', bots === '0', bots);
    // Admin in Supabase mode shows real login (no demo)
    await p.goto(B + '/diaxeirisi', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    check('admin (supabase mode): email/password login, no demo banner', (await p.locator('input[type="password"]').count()) === 1 && !(await p.isVisible('[role="note"]')));
    await p.screenshot({ path: out + '/sb-login.png' });

    // Offers by private link (RPCs get_public_offer / respond_offer, as anon)
    const tok = '7d0b3a52-6a54-4a51-9d55-0f1f1c1a2b3c', draftTok = '9a9b9c9d-0000-4000-8000-000000000001';
    execFileSync('psql', [...PG, '-qc', `insert into public.offers (public_token, status, client_name, title, items, valid_until, issuer) values
      ('${tok}', 'sent', 'Πελάτης Link', 'Μελέτη ξενώνα', '[{"id":"1","title":"Αρχιτεκτονική μελέτη","quantity":1,"unit":"κατ’ αποκοπή","unitPrice":3000}]', current_date + 10, '{"name":"Δήμητρα Σαπίδου","role":"Αρχιτέκτων Μηχανικός","studio":"DS Architect"}'),
      ('${draftTok}', 'draft', 'Πρόχειρος', 'Κρυφή', '[]', null, '{}')`]);
    await p.goto(B + '/prosfora/' + draftTok, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    check('offer: draft not visible by link', (await p.textContent('h1')).includes('δεν βρέθηκε'));
    await p.goto(B + '/prosfora/' + tok, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
    check('offer: sent offer rendered from RPC', (await p.textContent('.offer-doc')).includes('Μελέτη ξενώνα') && (await p.textContent('.offer-doc')).includes('3.720,00'));
    const pad = p.locator('[data-signature-pad]'); await pad.scrollIntoViewIfNeeded(); const bx = await pad.boundingBox();
    await p.mouse.move(bx.x + 30, bx.y + 90); await p.mouse.down();
    for (let k = 0; k < 20; k++) await p.mouse.move(bx.x + 30 + k * 12, bx.y + 90 - (k % 4) * 10);
    await p.mouse.up(); await p.check('[data-offer-respond] input[type="checkbox"]');
    await p.click('[data-offer-respond] button[type="submit"]'); await p.waitForTimeout(1500);
    const st = execFileSync('psql', [...PG, '-qtAc', `select status||'|'||client_signed_name||'|'||(client_signature like 'data:image/png;base64,%') from public.offers where public_token='${tok}'`], { encoding: 'utf8' }).trim();
    check('offer: client acceptance + signature stored via RPC', st === 'accepted|Πελάτης Link|true', st);
    check('offer: page shows accepted state', (await p.textContent('[role="status"]')).includes('έγινε αποδεκτή'));
  } catch (e) { results.push('ABORTED: ' + e.message.split('\n')[0]); }
  console.log(results.join('\n')); console.log('ERRORS', JSON.stringify(errors)); console.log('REST calls:', calls.length);
  await b.close();
  if (results.some((r) => !r.startsWith('PASS')) || errors.length) process.exit(1);
})();
