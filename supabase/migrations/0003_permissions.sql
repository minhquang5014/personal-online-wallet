-- =====================================================================
-- Phân quyền trong ví chung
-- Chạy SAU 0002_shared_wallet.sql
--
-- Mô hình quyền:
--   owner  — chủ ví: sửa/xoá MỌI giao dịch, quản lý danh mục & thành viên
--   member — thành viên: xem tất cả, thêm giao dịch,
--            nhưng chỉ sửa/xoá giao dịch DO CHÍNH MÌNH nhập
--
-- 0002 để `tx_update_member`/`tx_delete_member` cho mọi thành viên sửa/xoá
-- giao dịch của người khác. File này siết lại.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. `created_by` luôn phải có giá trị.
--    Policy insert đã bắt created_by = auth.uid(), nhưng NOT NULL chặn luôn
--    cả đường ghi bỏ qua RLS (service key), để không mất dấu "ai nhập".
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.transactions where created_by is null) then
    alter table public.transactions alter column created_by set not null;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. TRANSACTIONS: đọc chung, ghi theo quyền
-- ---------------------------------------------------------------------
-- Tên cũ (từ 0002) lẫn tên mới đều drop, để file chạy lại được nhiều lần.
drop policy if exists "tx_select_member" on public.transactions;
drop policy if exists "tx_insert_member" on public.transactions;
drop policy if exists "tx_update_member" on public.transactions;
drop policy if exists "tx_delete_member" on public.transactions;
drop policy if exists "tx_update_own_or_owner" on public.transactions;
drop policy if exists "tx_delete_own_or_owner" on public.transactions;

-- Ai trong ví cũng xem được toàn bộ giao dịch của ví.
create policy "tx_select_member"
  on public.transactions for select
  using (public.is_wallet_member(wallet_id));

-- Thêm giao dịch: phải là thành viên, và không được mạo danh người khác.
create policy "tx_insert_member"
  on public.transactions for insert
  with check (public.is_wallet_member(wallet_id) and created_by = auth.uid());

-- Sửa: chủ ví sửa được tất cả; thành viên chỉ sửa giao dịch của mình.
-- `with check` chặn việc sửa xong lại gán sang ví khác hoặc đổi người nhập.
create policy "tx_update_own_or_owner"
  on public.transactions for update
  using (
    public.is_wallet_member(wallet_id)
    and (created_by = auth.uid() or public.is_wallet_owner(wallet_id))
  )
  with check (
    public.is_wallet_member(wallet_id)
    and (created_by = auth.uid() or public.is_wallet_owner(wallet_id))
  );

-- Xoá: cùng quy tắc với sửa.
create policy "tx_delete_own_or_owner"
  on public.transactions for delete
  using (
    public.is_wallet_member(wallet_id)
    and (created_by = auth.uid() or public.is_wallet_owner(wallet_id))
  );

-- ---------------------------------------------------------------------
-- 2. CATEGORIES: chỉ chủ ví được sửa danh mục
--    Danh mục dùng chung cả nhà, để mỗi người tự đổi thì dễ loạn.
-- ---------------------------------------------------------------------
drop policy if exists "cat_select_default_or_member" on public.categories;
drop policy if exists "cat_insert_member" on public.categories;
drop policy if exists "cat_update_member" on public.categories;
drop policy if exists "cat_delete_member" on public.categories;
drop policy if exists "cat_insert_owner" on public.categories;
drop policy if exists "cat_update_owner" on public.categories;
drop policy if exists "cat_delete_owner" on public.categories;

create policy "cat_select_default_or_member"
  on public.categories for select
  using (wallet_id is null or public.is_wallet_member(wallet_id));

create policy "cat_insert_owner"
  on public.categories for insert
  with check (public.is_wallet_owner(wallet_id));

create policy "cat_update_owner"
  on public.categories for update
  using (public.is_wallet_owner(wallet_id))
  with check (public.is_wallet_owner(wallet_id));

create policy "cat_delete_owner"
  on public.categories for delete
  using (public.is_wallet_owner(wallet_id));

-- ---------------------------------------------------------------------
-- 3. Đổi vai trò thành viên (chỉ chủ ví, và không tự hạ quyền chính mình
--    thành member khiến ví không còn owner nào)
-- ---------------------------------------------------------------------
create or replace function public.set_member_role(p_wallet uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_wallet_owner(p_wallet) then
    raise exception 'Chỉ chủ ví mới đổi được vai trò';
  end if;
  if p_role not in ('owner', 'member') then
    raise exception 'Vai trò không hợp lệ: %', p_role;
  end if;
  if p_user = auth.uid() and p_role = 'member' then
    raise exception 'Không thể tự bỏ quyền chủ ví của chính mình';
  end if;

  update public.wallet_members
     set role = p_role
   where wallet_id = p_wallet and user_id = p_user;

  if not found then
    raise exception 'Người này không thuộc ví';
  end if;
end $$;

revoke execute on function public.set_member_role(uuid, uuid, text) from public;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. BẢNG profiles — tên hiển thị của từng người
--
--    Client KHÔNG đọc được `auth.users` (PostgREST không expose schema auth).
--    Nên muốn hiện "ai nhập" bằng TÊN chứ không phải uuid thì phải có bảng
--    profiles ở schema public, đồng bộ từ auth.users bằng trigger.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email        text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Xem được hồ sơ của chính mình và của người cùng ví.
create or replace function public.shares_wallet_with(u uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
      from public.wallet_members a
      join public.wallet_members b on b.wallet_id = a.wallet_id
     where a.user_id = auth.uid() and b.user_id = u
  );
$$;

revoke execute on function public.shares_wallet_with(uuid) from public;
grant execute on function public.shares_wallet_with(uuid) to authenticated;

drop policy if exists "profiles_select_self_or_wallet" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_select_self_or_wallet"
  on public.profiles for select
  using (id = auth.uid() or public.shares_wallet_with(id));

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Tự tạo profile mỗi khi có user mới đăng ký.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill cho user đã đăng ký từ trước.
insert into public.profiles (id, display_name, email)
select id, split_part(coalesce(email, ''), '@', 1), coalesce(email, '')
  from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. View: giao dịch kèm tên + vai trò người nhập
--    security_invoker = true -> RLS của `transactions` vẫn được áp dụng,
--    người ngoài ví không đọc trộm được qua view.
-- ---------------------------------------------------------------------
create or replace view public.transactions_with_creator
with (security_invoker = true) as
select
  t.*,
  p.display_name as creator_name,
  m.role         as creator_role
from public.transactions t
left join public.profiles       p on p.id = t.created_by
left join public.wallet_members m
       on m.wallet_id = t.wallet_id and m.user_id = t.created_by;

grant select on public.transactions_with_creator to authenticated;
