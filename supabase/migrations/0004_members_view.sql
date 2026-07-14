-- =====================================================================
-- View: thành viên của ví kèm tên hiển thị
-- Chạy SAU 0003_permissions.sql
--
-- PostgREST không embed được `wallet_members` -> `profiles` vì cả hai cùng
-- tham chiếu `auth.users` chứ không tham chiếu lẫn nhau. Dùng view cho gọn.
--
-- security_invoker = true  -> RLS của wallet_members + profiles vẫn áp dụng,
-- nên chỉ thấy thành viên của ví mà mình tham gia.
-- =====================================================================
create or replace view public.wallet_members_view
with (security_invoker = true) as
select
  m.wallet_id,
  m.user_id,
  m.role,
  coalesce(p.display_name, '') as display_name,
  coalesce(p.email, '')        as email,
  m.joined_at
from public.wallet_members m
left join public.profiles p on p.id = m.user_id;

grant select on public.wallet_members_view to authenticated;
