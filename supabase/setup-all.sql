create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.app_role as enum ('guest', 'admin');
create type public.album_visibility as enum ('public', 'members', 'restricted');
create type public.photo_visibility as enum ('private', 'public');
create type public.approval_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.activity_action as enum
  ('upload', 'delete', 'download', 'zip_download', 'approve', 'reject', 'visibility_change');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name   text not null default '' check (char_length(full_name) <= 120),
  role        public.app_role not null default 'guest',
  invited_by  uuid references auth.users (id) on delete set null,
  user_id     uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index invitations_email_key on public.invitations (lower(email));

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '' check (char_length(full_name) <= 120),
  role       public.app_role not null default 'guest',
  is_active  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role) where is_active;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invitations%rowtype;
begin
  select * into inv from public.invitations i where lower(i.email) = lower(new.email)
  order by i.created_at desc limit 1;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (new.id, new.email, coalesce(inv.full_name, ''), coalesce(inv.role, 'guest'), inv.id is not null)
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.invitations set user_id = new.id where id = inv.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin' and p.is_active);
$$;

create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active);
$$;

create table public.wedding_details (
  id                  smallint primary key default 1 check (id = 1),
  bride_name          text not null default 'Neha',
  groom_name          text,
  tagline             text not null default 'A Celebration of Love, Family & Forever.',
  wedding_date        timestamptz,
  venue_name          text,
  venue_address       text,
  location            text,
  maps_url            text check (maps_url is null or maps_url ~* '^https://'),
  hero_image_path     text,
  bride_intro         text,
  groom_intro         text,
  story_intro         text,
  story_timeline      jsonb not null default '[]' check (jsonb_typeof(story_timeline) = 'array'),
  families            jsonb not null default '[]' check (jsonb_typeof(families) = 'array'),
  faqs                jsonb not null default '[]' check (jsonb_typeof(faqs) = 'array'),
  contacts            jsonb not null default '[]' check (jsonb_typeof(contacts) = 'array'),
  invitation_message  text,
  rsvp_enabled        boolean not null default true,
  rsvp_deadline       date,
  privacy_contact     text,
  updated_at          timestamptz not null default now()
);
insert into public.wedding_details (id) values (1);

create table public.wedding_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 120),
  date_label   text check (char_length(date_label) <= 60),
  starts_at    timestamptz,
  ends_at      timestamptz,
  venue_name   text,
  address      text,
  maps_url     text check (maps_url is null or maps_url ~* '^https://'),
  description  text,
  dress_code   text,
  image_path   text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint event_times check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index wedding_events_order_idx on public.wedding_events (sort_order, starts_at);

insert into public.wedding_events (title, date_label, sort_order)
values ('31 January Celebration', '31 January', 1),
       ('Wedding Day', '15 February', 2);

create table public.albums (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 80),
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description      text check (char_length(description) <= 500),
  visibility       public.album_visibility not null default 'members',
  event_id         uuid references public.wedding_events (id) on delete set null,
  allow_uploads    boolean not null default true,
  allow_downloads  boolean not null default true,
  cover_photo_id   uuid,
  sort_order       int not null default 0,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);
create unique index albums_slug_key on public.albums (slug);
create index albums_event_idx on public.albums (event_id);

create table public.album_permissions (
  album_id     uuid not null references public.albums (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  can_view     boolean not null default true,
  can_upload   boolean not null default false,
  can_download boolean not null default true,
  granted_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (album_id, user_id)
);
create index album_permissions_user_idx on public.album_permissions (user_id);

create function public.can_view_album(p_album uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or (
    public.is_member() and exists (
      select 1 from public.albums a
      where a.id = p_album
        and (a.visibility in ('public', 'members')
             or exists (select 1 from public.album_permissions ap
                        where ap.album_id = a.id and ap.user_id = auth.uid() and ap.can_view))));
$$;

create function public.can_upload_album(p_album uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or (
    public.is_member() and exists (
      select 1 from public.albums a
      where a.id = p_album
        and ((a.visibility <> 'restricted' and a.allow_uploads)
             or exists (select 1 from public.album_permissions ap
                        where ap.album_id = a.id and ap.user_id = auth.uid() and ap.can_upload))));
$$;

create function public.can_download_album(p_album uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or (
    public.is_member() and exists (
      select 1 from public.albums a
      where a.id = p_album
        and ((a.visibility <> 'restricted' and a.allow_downloads)
             or exists (select 1 from public.album_permissions ap
                        where ap.album_id = a.id and ap.user_id = auth.uid()
                          and ap.can_view and ap.can_download))));
$$;

create table public.photos (
  id                uuid primary key default gen_random_uuid(),
  album_id          uuid not null references public.albums (id) on delete cascade,
  storage_path      text not null,
  thumbnail_path    text not null,
  preview_path      text not null,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  title             text check (char_length(title) <= 200),
  file_size         bigint not null check (file_size > 0 and file_size <= 52428800),
  mime_type         text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width             int check (width > 0),
  height            int check (height > 0),
  uploaded_by       uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  visibility        public.photo_visibility not null default 'private',
  approval_status   public.approval_status not null default 'none',
  constraint public_needs_approval check (visibility = 'private' or approval_status = 'approved')
);
create unique index photos_storage_path_key on public.photos (storage_path);
create index photos_album_created_idx on public.photos (album_id, created_at desc, id desc);
create index photos_created_idx on public.photos (created_at desc, id desc);
create index photos_uploader_idx on public.photos (uploaded_by, created_at desc);
create index photos_pending_idx on public.photos (created_at) where approval_status = 'pending';
create index photos_public_idx on public.photos (created_at desc) where visibility = 'public' and approval_status = 'approved';
create index photos_search_idx on public.photos using gin ((coalesce(title, '') || ' ' || original_filename) gin_trgm_ops);

alter table public.albums
  add constraint albums_cover_fk foreign key (cover_photo_id) references public.photos (id) on delete set null;

create table public.photo_favourites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  photo_id   uuid not null references public.photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);
create index photo_favourites_photo_idx on public.photo_favourites (photo_id);

create table public.photo_selections (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  photo_id   uuid not null references public.photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);
create index photo_selections_photo_idx on public.photo_selections (photo_id);

create table public.photo_approvals (
  id           uuid primary key default gen_random_uuid(),
  photo_id     uuid not null references public.photos (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  status       public.approval_status not null default 'pending' check (status <> 'none'),
  note         text check (char_length(note) <= 500),
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index photo_approvals_status_idx on public.photo_approvals (status, created_at);
create index photo_approvals_photo_idx on public.photo_approvals (photo_id);

create table public.upload_activity (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.profiles (id) on delete set null,
  action     public.activity_action not null,
  photo_id   uuid,
  album_id   uuid references public.albums (id) on delete set null,
  bytes      bigint,
  detail     jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index upload_activity_created_idx on public.upload_activity (created_at desc);
create index upload_activity_user_idx on public.upload_activity (user_id, created_at desc);

create table public.rsvps (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  email        text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        text check (char_length(phone) <= 30),
  attending    boolean not null,
  guests_count int not null default 1 check (guests_count between 0 and 20),
  event_ids    uuid[] not null default '{}',
  message      text check (char_length(message) <= 1000),
  created_at   timestamptz not null default now()
);
create index rsvps_created_idx on public.rsvps (created_at desc);

create table public.rate_limits (
  key          text primary key,
  hits         int not null,
  window_start timestamptz not null
);

create function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  allowed boolean;
begin
  insert into public.rate_limits as r (key, hits, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits <= p_max into allowed;
  return allowed;
end $$;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger wedding_details_touch before update on public.wedding_details for each row execute function public.touch_updated_at();

create function public.log_photo_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.upload_activity (user_id, action, photo_id, album_id, bytes, detail)
    values (new.uploaded_by, 'upload', new.id, new.album_id, new.file_size,
            jsonb_build_object('filename', new.original_filename));
    return new;
  else
    insert into public.upload_activity (user_id, action, photo_id, album_id, bytes, detail)
    values (coalesce(auth.uid(), old.uploaded_by), 'delete', old.id,
            (select a.id from public.albums a where a.id = old.album_id), old.file_size,
            jsonb_build_object('filename', old.original_filename));
    return old;
  end if;
end $$;
create trigger photos_log_insert after insert on public.photos for each row execute function public.log_photo_change();
create trigger photos_log_delete after delete on public.photos for each row execute function public.log_photo_change();

create function public.request_photo_public(p_photo uuid, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  ph public.photos%rowtype;
begin
  select * into ph from public.photos where id = p_photo;
  if ph.id is null or not (public.is_admin() or (public.is_member() and ph.uploaded_by = auth.uid())) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if ph.approval_status in ('pending', 'approved') then
    return;
  end if;
  update public.photos set approval_status = 'pending' where id = p_photo;
  insert into public.photo_approvals (photo_id, requested_by, note) values (p_photo, auth.uid(), left(p_note, 500));
end $$;

create function public.review_photo(p_photo uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.photos
     set approval_status = case when p_approve then 'approved' else 'rejected' end::public.approval_status,
         visibility      = case when p_approve then 'public' else 'private' end::public.photo_visibility
   where id = p_photo;
  if not found then
    raise exception 'photo not found' using errcode = 'P0002';
  end if;
  update public.photo_approvals
     set status = case when p_approve then 'approved' else 'rejected' end::public.approval_status,
         reviewed_by = auth.uid(), reviewed_at = now(), note = coalesce(left(p_note, 500), note)
   where photo_id = p_photo and status = 'pending';
  insert into public.upload_activity (user_id, action, photo_id, detail)
  values (auth.uid(), case when p_approve then 'approve' else 'reject' end::public.activity_action, p_photo,
          jsonb_build_object('note', p_note));
end $$;

create function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'photos',           (select count(*) from public.photos),
    'users',            (select count(*) from public.profiles where is_active),
    'inactive_users',   (select count(*) from public.profiles where not is_active),
    'pending_invites',  (select count(*) from public.invitations where accepted_at is null),
    'albums',           (select count(*) from public.albums),
    'storage_bytes',    (select coalesce(sum(file_size), 0) from public.photos),
    'pending_approvals',(select count(*) from public.photos where approval_status = 'pending'),
    'public_photos',    (select count(*) from public.photos where visibility = 'public'),
    'rsvps',            (select count(*) from public.rsvps),
    'rsvp_guests',      (select coalesce(sum(guests_count), 0) from public.rsvps where attending),
    'daily_uploads',    (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', coalesce(c.n, 0)) order by d), '[]')
                         from generate_series(current_date - 13, current_date, interval '1 day') d
                         left join (select created_at::date as day, count(*) as n from public.photos
                                    where created_at >= current_date - 13 group by 1) c on c.day = d::date)
  ) into result;
  return result;
end $$;

alter table public.invitations       enable row level security;
alter table public.profiles          enable row level security;
alter table public.wedding_details   enable row level security;
alter table public.wedding_events    enable row level security;
alter table public.albums            enable row level security;
alter table public.album_permissions enable row level security;
alter table public.photos            enable row level security;
alter table public.photo_favourites  enable row level security;
alter table public.photo_selections  enable row level security;
alter table public.photo_approvals   enable row level security;
alter table public.upload_activity   enable row level security;
alter table public.rsvps             enable row level security;
alter table public.rate_limits       enable row level security;

create policy invitations_admin on public.invitations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.profiles from anon, authenticated;
grant select (id, full_name, role, is_active, created_at) on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy wedding_details_read on public.wedding_details for select to anon, authenticated using (true);
create policy wedding_details_admin on public.wedding_details for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy events_read on public.wedding_events for select to anon, authenticated
  using (is_published or public.is_admin());
create policy events_admin on public.wedding_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy albums_read on public.albums for select to anon, authenticated
  using (visibility = 'public' or public.can_view_album(id));
create policy albums_admin on public.albums for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy album_permissions_read on public.album_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy album_permissions_admin on public.album_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy photos_read_public on public.photos for select to anon, authenticated
  using (visibility = 'public' and approval_status = 'approved');
create policy photos_read_members on public.photos for select to authenticated
  using (public.can_view_album(album_id));
create policy photos_insert on public.photos for insert to authenticated
  with check (uploaded_by = auth.uid()
              and public.can_upload_album(album_id)
              and visibility = 'private'
              and approval_status = 'none');
create policy photos_update_admin on public.photos for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy photos_delete on public.photos for delete to authenticated
  using (public.is_admin() or (uploaded_by = auth.uid() and public.is_member()));

create policy favourites_own on public.photo_favourites for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_member()
              and exists (select 1 from public.photos p where p.id = photo_id));
create policy selections_own on public.photo_selections for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_member()
              and exists (select 1 from public.photos p where p.id = photo_id));

create policy approvals_read on public.photo_approvals for select to authenticated
  using (requested_by = auth.uid() or public.is_admin());
create policy approvals_admin on public.photo_approvals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy activity_read on public.upload_activity for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy rsvps_admin on public.rsvps for select to authenticated using (public.is_admin());
create policy rsvps_admin_delete on public.rsvps for delete to authenticated using (public.is_admin());


revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.review_photo(uuid, boolean, text) from public, anon;
revoke execute on function public.request_photo_public(uuid, text) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_photo_change() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
       ('site',   'site',   true,  10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.upload_counts() returns table (user_id uuid, uploads bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query select p.uploaded_by, count(*) from public.photos p where p.uploaded_by is not null group by 1;
end $$;

revoke execute on function public.upload_counts() from public, anon;


alter table public.wedding_details
  add column bride_photo_path text,
  add column groom_photo_path text;

update public.wedding_details set groom_name = 'Rudra' where id = 1 and groom_name is null;

alter table public.photos
  add column is_featured boolean not null default false,
  add column featured_order int not null default 0,
  add constraint featured_must_be_public check (not is_featured or (visibility = 'public' and approval_status = 'approved'));

create index photos_featured_idx on public.photos (featured_order, created_at desc) where is_featured;

create or replace function public.review_photo(p_photo uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.photos
     set approval_status = case when p_approve then 'approved' else 'rejected' end::public.approval_status,
         visibility      = case when p_approve then 'public' else 'private' end::public.photo_visibility,
         is_featured     = case when p_approve then is_featured else false end
   where id = p_photo;
  if not found then
    raise exception 'photo not found' using errcode = 'P0002';
  end if;
  update public.photo_approvals
     set status = case when p_approve then 'approved' else 'rejected' end::public.approval_status,
         reviewed_by = auth.uid(), reviewed_at = now(), note = coalesce(left(p_note, 500), note)
   where photo_id = p_photo and status = 'pending';
  insert into public.upload_activity (user_id, action, photo_id, detail)
  values (auth.uid(), case when p_approve then 'approve' else 'reject' end::public.activity_action, p_photo,
          jsonb_build_object('note', p_note));
end $$;
revoke execute on function public.review_photo(uuid, boolean, text) from public, anon;

create table public.wishes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  message    text not null check (char_length(message) between 2 and 600),
  status     public.approval_status not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index wishes_status_idx on public.wishes (status, created_at desc);

alter table public.wishes enable row level security;

create policy wishes_read_public on public.wishes for select to anon, authenticated
  using (status = 'approved');
create policy wishes_read_own on public.wishes for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy wishes_insert_member on public.wishes for insert to authenticated
  with check (user_id = auth.uid() and public.is_member() and status = 'pending');
create policy wishes_delete_own on public.wishes for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy wishes_admin_update on public.wishes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

update public.wedding_events set date_label = '31 January 2027' where date_label = '31 January';
update public.wedding_events set date_label = '15 February 2027' where date_label = '15 February';
update public.wedding_details set wedding_date = '2027-02-15T00:00:00+05:30' where id = 1 and wedding_date is null;
