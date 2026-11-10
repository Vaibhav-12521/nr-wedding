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
