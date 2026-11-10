import { beforeAll, describe, expect, it } from "vitest";
import { createDb } from "./harness";

type Db = Awaited<ReturnType<typeof createDb>>;
let t: Db;
const ids: Record<string, string> = {};

const anon = { role: "anon" } as const;
const user = (name: string) => ({ role: "authenticated", id: ids[name] }) as const;
const service = { role: "service_role" } as const;

async function photo(album: string, uploader: string, extra: Record<string, string> = {}) {
  const [row] = await t.as(service, (q) =>
    q<{ id: string }>(
      `insert into public.photos (album_id, storage_path, thumbnail_path, preview_path, original_filename, file_size, mime_type, uploaded_by, visibility, approval_status)
       values ($1, $2, $2 || '.t', $2 || '.p', 'IMG.jpg', 1000, 'image/jpeg', $3, $4, $5) returning id`,
      [ids[album], `p/${crypto.randomUUID()}`, ids[uploader], extra.visibility ?? "private", extra.approval ?? "none"],
    ),
  );
  return row.id;
}

beforeAll(async () => {
  t = await createDb();
  await t.as(service, async (q) => {
    await q(`insert into public.invitations (email, full_name, role) values
      ('admin@x.com', 'Admin', 'admin'), ('g1@x.com', 'Guest One', 'guest'),
      ('g2@x.com', 'Guest Two', 'guest'), ('off@x.com', 'Deactivated', 'guest')`);
  });
  for (const [name, email, meta] of [
    ["admin", "admin@x.com", {}],
    ["g1", "g1@x.com", {}],
    ["g2", "g2@x.com", {}],
    ["off", "off@x.com", {}],
    ["stranger", "stranger@x.com", { role: "admin", full_name: "I am admin" }],
  ] as const) {
    const [r] = await t.as(service, (q) =>
      q<{ id: string }>(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, JSON.stringify(meta)]),
    );
    ids[name] = r.id;
  }
  await t.as(service, async (q) => {
    await q(`update public.profiles set is_active = false where id = $1`, [ids.off]);
    for (const [key, vis] of [["pub", "public"], ["mem", "members"], ["res", "restricted"]]) {
      const [a] = await q<{ id: string }>(
        `insert into public.albums (name, slug, visibility) values ($1, $1, $2) returning id`, [key, vis]);
      ids[key] = a.id;
    }
    await q(`insert into public.album_permissions (album_id, user_id, can_view, can_upload, can_download) values ($1, $2, true, true, false)`,
      [ids.res, ids.g2]);
  });
  ids.pubPhoto = await photo("pub", "admin");
  ids.approved = await photo("mem", "admin", { visibility: "public", approval: "approved" });
  ids.memPhoto = await photo("mem", "g1");
  ids.resPhoto = await photo("res", "admin");
});

describe("invitations and accounts", () => {
  it("invited users become active with the invited role", async () => {
    const rows = await t.as(service, (q) => q<{ id: string; role: string; is_active: boolean; full_name: string }>(
      `select id, role, is_active, full_name from public.profiles where id in ($1, $2)`, [ids.admin, ids.g1]));
    expect(rows.find((r) => r.id === ids.admin)).toMatchObject({ role: "admin", is_active: true });
    expect(rows.find((r) => r.id === ids.g1)).toMatchObject({ role: "guest", is_active: true, full_name: "Guest One" });
  });

  it("an uninvited signup is an inactive guest, whatever metadata it sends", async () => {
    const [p] = await t.as(service, (q) => q(`select role, is_active, full_name from public.profiles where id = $1`, [ids.stranger]));
    expect(p).toMatchObject({ role: "guest", is_active: false, full_name: "" });
  });

  it("a user cannot make themselves admin or reactivate themselves", async () => {
    expect(await t.rejects(user("g1"), `update public.profiles set role = 'admin' where id = $1`, [ids.g1])).toMatch(/permission denied/);
    expect(await t.rejects(user("off"), `update public.profiles set is_active = true where id = $1`, [ids.off])).toMatch(/permission denied/);
  });

  it("a user can change their own name but nobody else's", async () => {
    await t.as(user("g1"), (q) => q(`update public.profiles set full_name = 'G One' where id = $1`, [ids.g1]));
    const changed = await t.as(user("g1"), (q) => q(`update public.profiles set full_name = 'hacked' where id = $1 returning id`, [ids.g2]));
    expect(changed).toHaveLength(0);
  });

  it("guests cannot read other people's email addresses", async () => {
    expect(await t.rejects(user("g1"), `select email from public.profiles`)).toMatch(/permission denied/);
    const names = await t.as(user("g1"), (q) => q(`select full_name from public.profiles`));
    expect(names.length).toBeGreaterThan(1);
  });

  it("the public and guests cannot read the invitation list", async () => {
    expect(await t.as(user("g1"), (q) => q(`select * from public.invitations`))).toHaveLength(0);
    expect(await t.rejects(anon, `select * from public.profiles`)).toMatch(/permission denied/);
  });
});

describe("public visitors", () => {
  it("see wedding details and published events", async () => {
    const [d] = await t.as(anon, (q) => q(`select bride_name, groom_name, tagline from public.wedding_details`));
    expect(d).toMatchObject({ bride_name: "Neha", groom_name: "Rudra" });
    const events = await t.as(anon, (q) => q(`select title, starts_at from public.wedding_events order by sort_order`));
    expect(events.map((e) => e.title)).toEqual(["31 January Celebration", "Wedding Day"]);
    expect(events.every((e) => e.starts_at === null)).toBe(true);
    const labels = await t.as(anon, (q) => q<{ date_label: string }>(`select date_label from public.wedding_events order by sort_order`));
    expect(labels.map((e) => e.date_label)).toEqual(["31 January 2027", "15 February 2027"]);
  });

  it("only see photos that are public AND approved", async () => {
    const rows = await t.as(anon, (q) => q<{ id: string }>(`select id from public.photos`));
    expect(rows.map((r) => r.id)).toEqual([ids.approved]);
  });

  it("only see public albums", async () => {
    const rows = await t.as(anon, (q) => q<{ slug: string }>(`select slug from public.albums`));
    expect(rows.map((r) => r.slug)).toEqual(["pub"]);
  });

  it("cannot write anything", async () => {
    await t.rejects(anon, `insert into public.photos (album_id, storage_path, thumbnail_path, preview_path, original_filename, file_size, mime_type)
                           values ($1, 'x', 'x', 'x', 'x.jpg', 1, 'image/jpeg')`, [ids.pub]);
    const upd = await t.as(anon, (q) => q(`update public.wedding_details set bride_name = 'X' returning id`));
    expect(upd).toHaveLength(0);
    expect(await t.rejects(anon, `select public.admin_stats()`)).toMatch(/permission denied/);
  });
});

describe("guests and album permissions", () => {
  it("see public + members albums, not restricted ones they weren't granted", async () => {
    const g1 = await t.as(user("g1"), (q) => q<{ slug: string }>(`select slug from public.albums order by slug`));
    expect(g1.map((r) => r.slug)).toEqual(["mem", "pub"]);
    const g2 = await t.as(user("g2"), (q) => q<{ slug: string }>(`select slug from public.albums order by slug`));
    expect(g2.map((r) => r.slug)).toEqual(["mem", "pub", "res"]);
  });

  it("cannot see photos in a restricted album, even by id", async () => {
    expect(await t.as(user("g1"), (q) => q(`select id from public.photos where id = $1`, [ids.resPhoto]))).toHaveLength(0);
    expect(await t.as(user("g2"), (q) => q(`select id from public.photos where id = $1`, [ids.resPhoto]))).toHaveLength(1);
  });

  const insert = `insert into public.photos (album_id, storage_path, thumbnail_path, preview_path, original_filename, file_size, mime_type, uploaded_by, visibility, approval_status)
                  values ($1, $2, 't', 'p', 'a.jpg', 10, 'image/jpeg', $3, $4, $5) returning id`;

  it("can upload to members albums as themselves", async () => {
    const r = await t.as(user("g1"), (q) => q(insert, [ids.mem, `g1/${crypto.randomUUID()}`, ids.g1, "private", "none"]));
    expect(r).toHaveLength(1);
  });

  it("cannot upload to a restricted album without permission, or as someone else", async () => {
    expect(await t.rejects(user("g1"), insert, [ids.res, "a1", ids.g1, "private", "none"])).toMatch(/row-level security/);
    expect(await t.rejects(user("g1"), insert, [ids.mem, "a2", ids.g2, "private", "none"])).toMatch(/row-level security/);
    const ok = await t.as(user("g2"), (q) => q(insert, [ids.res, `g2/${crypto.randomUUID()}`, ids.g2, "private", "none"]));
    expect(ok).toHaveLength(1);
  });

  it("cannot publish their own upload or skip approval", async () => {
    expect(await t.rejects(user("g1"), insert, [ids.mem, "a3", ids.g1, "public", "approved"])).toMatch(/row-level security/);
    const upd = await t.as(user("g1"), (q) => q(`update public.photos set visibility = 'public', approval_status = 'approved' where id = $1 returning id`, [ids.memPhoto]));
    expect(upd).toHaveLength(0);
  });

  it("can delete only their own photos", async () => {
    const theirs = await t.as(user("g1"), (q) => q(`delete from public.photos where id = $1 returning id`, [ids.approved]));
    expect(theirs).toHaveLength(0);
    const own = await photo("mem", "g1");
    const mine = await t.as(user("g1"), (q) => q(`delete from public.photos where id = $1 returning id`, [own]));
    expect(mine).toHaveLength(1);
  });

  it("download permission follows the album grant", async () => {
    const [g2] = await t.as(user("g2"), (q) => q<{ d: boolean }>(`select public.can_download_album($1) as d`, [ids.res]));
    expect(g2.d).toBe(false);
    const [g1] = await t.as(user("g1"), (q) => q<{ d: boolean }>(`select public.can_download_album($1) as d`, [ids.mem]));
    expect(g1.d).toBe(true);
  });

  it("favourites and selections are private and limited to visible photos", async () => {
    await t.as(user("g1"), (q) => q(`insert into public.photo_favourites (user_id, photo_id) values ($1, $2)`, [ids.g1, ids.memPhoto]));
    await t.as(user("g1"), (q) => q(`insert into public.photo_selections (user_id, photo_id) values ($1, $2)`, [ids.g1, ids.memPhoto]));
    expect(await t.rejects(user("g1"), `insert into public.photo_favourites (user_id, photo_id) values ($1, $2)`, [ids.g1, ids.resPhoto])).toMatch(/row-level security/);
    expect(await t.rejects(user("g1"), `insert into public.photo_selections (user_id, photo_id) values ($1, $2)`, [ids.g2, ids.memPhoto])).toMatch(/row-level security/);
    expect(await t.as(user("g2"), (q) => q(`select * from public.photo_favourites`))).toHaveLength(0);
  });
});

describe("deactivated accounts", () => {
  it("lose access to member content and cannot upload", async () => {
    const albums = await t.as(user("off"), (q) => q<{ slug: string }>(`select slug from public.albums`));
    expect(albums.map((a) => a.slug)).toEqual(["pub"]);
    const photos = await t.as(user("off"), (q) => q<{ id: string }>(`select id from public.photos`));
    expect(photos.map((p) => p.id)).toEqual([ids.approved]);
    expect(await t.rejects(user("off"), `insert into public.photos (album_id, storage_path, thumbnail_path, preview_path, original_filename, file_size, mime_type, uploaded_by)
      values ($1, 'z', 't', 'p', 'a.jpg', 1, 'image/jpeg', $2)`, [ids.mem, ids.off])).toMatch(/row-level security/);
    expect(await t.rejects(user("off"), `insert into public.photo_favourites (user_id, photo_id) values ($1, $2)`, [ids.off, ids.approved])).toMatch(/row-level security/);
  });
});

describe("approval workflow", () => {
  it("the uploader can request publication; another guest cannot", async () => {
    expect(await t.rejects(user("g2"), `select public.request_photo_public($1)`, [ids.memPhoto])).toMatch(/not allowed/);
    await t.as(user("g1"), (q) => q(`select public.request_photo_public($1, 'please')`, [ids.memPhoto]));
    const [p] = await t.as(service, (q) => q(`select approval_status, visibility from public.photos where id = $1`, [ids.memPhoto]));
    expect(p).toMatchObject({ approval_status: "pending", visibility: "private" });
    expect(await t.as(anon, (q) => q(`select id from public.photos where id = $1`, [ids.memPhoto]))).toHaveLength(0);
  });

  it("only admins can approve, and approval publishes the photo", async () => {
    expect(await t.rejects(user("g1"), `select public.review_photo($1, true)`, [ids.memPhoto])).toMatch(/admin only/);
    await t.as(user("admin"), (q) => q(`select public.review_photo($1, true, 'lovely')`, [ids.memPhoto]));
    const seen = await t.as(anon, (q) => q(`select id from public.photos where id = $1`, [ids.memPhoto]));
    expect(seen).toHaveLength(1);
    const [a] = await t.as(user("admin"), (q) => q(`select status, reviewed_by from public.photo_approvals where photo_id = $1`, [ids.memPhoto]));
    expect(a).toMatchObject({ status: "approved", reviewed_by: ids.admin });
  });

  it("a photo can never be public without approval", async () => {
    expect(await t.rejects(service, `update public.photos set visibility = 'public' where id = $1`, [ids.resPhoto])).toMatch(/public_needs_approval/);
  });
});

describe("admins", () => {
  it("see everything, including restricted albums and all photos", async () => {
    const albums = await t.as(user("admin"), (q) => q(`select id from public.albums`));
    expect(albums).toHaveLength(3);
    const [{ n }] = await t.as(user("admin"), (q) => q<{ n: number }>(`select count(*)::int as n from public.photos`));
    const [{ all }] = await t.as(service, (q) => q<{ all: number }>(`select count(*)::int as all from public.photos`));
    expect(n).toBe(all);
  });

  it("get dashboard statistics; guests don't", async () => {
    const [{ s }] = await t.as(user("admin"), (q) => q<{ s: Record<string, unknown> }>(`select public.admin_stats() as s`));
    expect(s).toMatchObject({ albums: 3, users: 3 });
    expect((s.daily_uploads as unknown[]).length).toBe(14);
    expect(await t.rejects(user("g1"), `select public.admin_stats()`)).toMatch(/admin only/);
  });

  it("can edit wedding details; guests can't", async () => {
    await t.as(user("admin"), (q) => q(`update public.wedding_details set groom_name = 'Test Groom'`));
    const g = await t.as(user("g1"), (q) => q(`update public.wedding_details set groom_name = 'X' returning id`));
    expect(g).toHaveLength(0);
  });
});

describe("activity log and rate limiting", () => {
  it("records uploads and deletions automatically", async () => {
    const rows = await t.as(user("admin"), (q) => q<{ action: string }>(`select action from public.upload_activity`));
    expect(rows.some((r) => r.action === "upload")).toBe(true);
    expect(rows.some((r) => r.action === "delete")).toBe(true);
    expect(rows.some((r) => r.action === "approve")).toBe(true);
  });

  it("guests only see their own activity", async () => {
    const rows = await t.as(user("g2"), (q) => q<{ user_id: string }>(`select user_id from public.upload_activity`));
    expect(rows.every((r) => r.user_id === ids.g2)).toBe(true);
  });

  it("limits calls per window, and the limiter isn't callable from the API", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) {
      const [r] = await t.as(service, (q) => q<{ ok: boolean }>(`select public.hit_rate_limit('test', 3, 60) as ok`));
      results.push(r.ok);
    }
    expect(results).toEqual([true, true, true, false]);
    expect(await t.rejects(user("g1"), `select public.hit_rate_limit('x', 1, 60)`)).toMatch(/permission denied/);
  });
});

describe("admin helpers", () => {
  it("per-uploader counts are admin-only", async () => {
    const rows = await t.as(user("admin"), (q) => q<{ user_id: string; uploads: number }>(`select * from public.upload_counts()`));
    expect(rows.find((r) => r.user_id === ids.admin)).toBeTruthy();
    expect(await t.rejects(user("g1"), `select * from public.upload_counts()`)).toMatch(/admin only/);
  });

  it("deleting an album with photos works and is logged", async () => {
    const [a] = await t.as(service, (q) => q<{ id: string }>(`insert into public.albums (name, slug) values ('tmp', 'tmp') returning id`));
    ids.tmp = a.id;
    await photo("tmp", "g1");
    await photo("tmp", "admin");
    const gone = await t.as(user("admin"), (q) => q(`delete from public.albums where id = $1 returning id`, [ids.tmp]));
    expect(gone).toHaveLength(1);
    const [{ n }] = await t.as(service, (q) => q<{ n: number }>(`select count(*)::int as n from public.photos where album_id = $1`, [ids.tmp]));
    expect(n).toBe(0);
    const logged = await t.as(service, (q) => q(`select * from public.upload_activity where action = 'delete' and detail->>'filename' = 'IMG.jpg' and album_id is null`));
    expect(logged.length).toBeGreaterThanOrEqual(2);
  });

  it("guests cannot delete albums", async () => {
    const r = await t.as(user("g1"), (q) => q(`delete from public.albums where id = $1 returning id`, [ids.mem]));
    expect(r).toHaveLength(0);
  });
});

describe("couple, featured photos and wishes", () => {
  it("knows the groom's name", async () => {
    const [d] = await t.as(anon, (q) => q(`select bride_name, groom_name from public.wedding_details`));
    expect(d).toMatchObject({ bride_name: "Neha" });
  });

  it("a photo can only be featured once it is public and approved", async () => {
    expect(await t.rejects(service, `update public.photos set is_featured = true where id = $1`, [ids.resPhoto])).toMatch(/featured_must_be_public/);
    await t.as(user("admin"), (q) => q(`update public.photos set is_featured = true where id = $1`, [ids.approved]));
    const rows = await t.as(anon, (q) => q(`select id from public.photos where is_featured`));
    expect(rows).toHaveLength(1);
  });

  it("guests can't feature photos; rejecting unfeatures", async () => {
    const r = await t.as(user("g1"), (q) => q(`update public.photos set is_featured = false where id = $1 returning id`, [ids.approved]));
    expect(r).toHaveLength(0);
    await t.as(user("admin"), (q) => q(`select public.review_photo($1, false)`, [ids.approved]));
    const [p] = await t.as(service, (q) => q(`select is_featured, visibility from public.photos where id = $1`, [ids.approved]));
    expect(p).toMatchObject({ is_featured: false, visibility: "private" });
  });

  it("wishes: members post (pending), the public only sees approved ones", async () => {
    await t.as(user("g1"), (q) => q(`insert into public.wishes (user_id, name, message) values ($1, 'G1', 'Congratulations!')`, [ids.g1]));
    expect(await t.rejects(user("g1"), `insert into public.wishes (user_id, name, message, status) values ($1, 'G1', 'Skip review', 'approved')`, [ids.g1])).toMatch(/row-level security/);
    expect(await t.rejects(user("g1"), `insert into public.wishes (user_id, name, message) values ($1, 'G2', 'Impersonate')`, [ids.g2])).toMatch(/row-level security/);
    expect(await t.rejects(user("off"), `insert into public.wishes (user_id, name, message) values ($1, 'Off', 'Hello there')`, [ids.off])).toMatch(/row-level security/);
    expect(await t.rejects(anon, `insert into public.wishes (name, message) values ('Anon', 'Spam spam')`)).toMatch(/row-level security|permission/);
    expect(await t.as(anon, (q) => q(`select * from public.wishes`))).toHaveLength(0);
    expect(await t.as(user("g1"), (q) => q(`select * from public.wishes`))).toHaveLength(1);
    expect(await t.as(user("g2"), (q) => q(`select * from public.wishes`))).toHaveLength(0);
    const g = await t.as(user("g1"), (q) => q(`update public.wishes set status = 'approved' returning id`));
    expect(g).toHaveLength(0);
    await t.as(user("admin"), (q) => q(`update public.wishes set status = 'approved'`));
    expect(await t.as(anon, (q) => q(`select name, message from public.wishes`))).toEqual([{ name: "G1", message: "Congratulations!" }]);
  });
});

describe("storage buckets", () => {
  it("photos bucket is private, site bucket is public", async () => {
    const rows = await t.as(service, (q) => q<{ id: string; public: boolean }>(`select id, public from storage.buckets order by id`));
    expect(rows).toEqual([{ id: "photos", public: false }, { id: "site", public: true }]);
  });
});
