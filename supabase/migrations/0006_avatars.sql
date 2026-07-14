-- =====================================================================
-- Ảnh đại diện
-- Chạy SAU 0005_created_by_fk.sql
--
-- Ảnh lưu ở Supabase Storage, bucket `avatars`, theo đường dẫn:
--     <user_id>/avatar.jpg
-- Policy dựa vào thư mục đầu tiên của path = auth.uid(), nên mỗi người chỉ
-- ghi đè được ảnh của chính mình.
-- =====================================================================

alter table public.profiles add column if not exists avatar_url text not null default '';

-- ---------------------------------------------------------------------
-- Bucket public: ai cũng đọc được ảnh (qua CDN), chỉ chủ ảnh mới ghi.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_read_all"    on storage.objects;
drop policy if exists "avatars_insert_own"  on storage.objects;
drop policy if exists "avatars_update_own"  on storage.objects;
drop policy if exists "avatars_delete_own"  on storage.objects;

create policy "avatars_read_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- View thành viên: bổ sung avatar_url
-- CREATE OR REPLACE VIEW chỉ cho thêm cột ở CUỐI danh sách.
-- ---------------------------------------------------------------------
create or replace view public.wallet_members_view
with (security_invoker = true) as
select
  m.wallet_id,
  m.user_id,
  m.role,
  coalesce(p.display_name, '') as display_name,
  coalesce(p.email, '')        as email,
  m.joined_at,
  coalesce(p.avatar_url, '')   as avatar_url
from public.wallet_members m
left join public.profiles p on p.id = m.user_id;

grant select on public.wallet_members_view to authenticated;
