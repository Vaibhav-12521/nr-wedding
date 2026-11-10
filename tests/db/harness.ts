import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}',
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );

  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- In Supabase, Auth (not the API roles) writes auth.users; the tests use service_role for that.
  grant all on auth.users, storage.buckets to service_role;
  -- Supabase's default privileges: the API roles get table access, RLS decides rows.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export type Who = { role: "anon" } | { role: "authenticated"; id: string } | { role: "service_role" };

export async function createDb(opts: { sqlFiles?: string[] } = {}) {
  const db = await PGlite.create({ extensions: { pg_trgm, pgcrypto } });
  await db.exec(SUPABASE_STUB);
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = opts.sqlFiles ?? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => join(dir, f));
  for (const file of files) {
    await db.exec(readFileSync(file, "utf8"));
  }

  async function as<T>(who: Who, fn: (q: <R = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<R[]>) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.query(`select set_config('role', $1, true)`, [who.role]);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [who.role === "authenticated" ? who.id : ""]);
      const q = async <R,>(sql: string, params: unknown[] = []) => (await tx.query<R>(sql, params)).rows;
      return fn(q);
    });
  }

  async function rejects(who: Who, sql: string, params: unknown[] = []): Promise<string> {
    try {
      await as(who, (q) => q(sql, params));
    } catch (e) {
      return (e as Error).message;
    }
    throw new Error(`expected to be rejected: ${sql}`);
  }

  return { db, as, rejects };
}
