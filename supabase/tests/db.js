// Test helpers for the Supabase data rules: a PGlite database (Postgres in
// the test process) with supabase-shim.sql and the migrations loaded, and a
// way to run queries as a given person, the way Supabase does: the role
// (anon / authenticated / service_role) plus the JWT claims.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const MIGRATIONS = path.join(ROOT, 'supabase/migrations');

export async function makeDb({ content = false } = {}) {
  const db = new PGlite();
  await db.exec(fs.readFileSync(path.join(ROOT, 'supabase/tests/supabase-shim.sql'), 'utf8'));
  for (const file of fs.readdirSync(MIGRATIONS).sort()) {
    if (!content && file.endsWith('_content.sql')) continue;
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  }
  return db;
}

// A fake login (auth.users row). role 'admin' goes in app_metadata.
export async function addUser(db, email, { admin = false } = {}) {
  const meta = admin ? { provider: 'email', role: 'admin' } : { provider: 'email' };
  const { rows } = await db.query('insert into auth.users (email, raw_app_meta_data) values ($1, $2) returning id', [email, meta]);
  return { id: rows[0].id, email, admin };
}

async function setPerson(db, role, claims) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await db.exec(`set role ${role}`);
}

// Runs fn(q) as this person; q(sql, params) returns rows. Always resets after.
export async function as(db, person, fn) {
  if (person === 'anon') await setPerson(db, 'anon', {});
  else if (person === 'service') await setPerson(db, 'service_role', { role: 'service_role' });
  else {
    await setPerson(db, 'authenticated', {
      sub: person.id,
      email: person.email,
      role: 'authenticated',
      app_metadata: person.admin ? { role: 'admin' } : {},
    });
  }
  try {
    return await fn(async (sql, params) => (await db.query(sql, params)).rows);
  } finally {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}
