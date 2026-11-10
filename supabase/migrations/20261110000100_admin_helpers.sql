create function public.upload_counts() returns table (user_id uuid, uploads bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query select p.uploaded_by, count(*) from public.photos p where p.uploaded_by is not null group by 1;
end $$;

revoke execute on function public.upload_counts() from public, anon;
