-- =====================================================================
-- Ví chung — cho nhiều người (vd: 2 vợ chồng) cùng dùng một ví
-- Chạy SAU 0001_init.sql: dán toàn bộ file vào Supabase → SQL Editor → Run
--
-- Ý tưởng: giao dịch không còn thuộc về 1 user, mà thuộc về 1 VÍ.
-- User là THÀNH VIÊN của ví. Vẫn lưu `created_by` để biết ai đã nhập.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BẢNG wallets + wallet_members
-- ---------------------------------------------------------------------
create table if not exists public.wallets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique,          -- mã 6 ký tự để mời người khác
  created_at  timestamptz not null default now()
);

create table if not exists public.wallet_members (
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

create index if not exists wallet_members_user_idx on public.wallet_members (user_id);

-- ---------------------------------------------------------------------
-- 2. HÀM SINH MÃ MỜI
--    Bỏ các ký tự dễ nhầm (0/O, 1/I) cho dễ đọc qua điện thoại.
-- ---------------------------------------------------------------------
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code     text := '';
  i        int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end $$;

-- ---------------------------------------------------------------------
-- 3. HÀM KIỂM TRA QUYỀN  (security definer = CHỐNG ĐỆ QUY RLS)
--
--    Nếu viết thẳng `exists (select 1 from wallet_members ...)` vào policy
--    CỦA CHÍNH bảng wallet_members, Postgres sẽ áp lại policy đó lên
--    subquery -> đệ quy vô hạn. Hàm security definer chạy bằng quyền của
--    owner nên bỏ qua RLS, cắt được vòng lặp.
-- ---------------------------------------------------------------------
create or replace function public.is_wallet_member(w uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.wallet_members m
     where m.wallet_id = w and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_wallet_owner(w uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.wallets x
     where x.id = w and x.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 4. ĐỔI CHỦ SỞ HỮU DỮ LIỆU: user_id -> wallet_id
--    Thêm cột trước, chuyển dữ liệu cũ (nếu có), rồi mới bỏ cột cũ.
-- ---------------------------------------------------------------------
alter table public.transactions add column if not exists wallet_id  uuid references public.wallets (id) on delete cascade;
alter table public.transactions add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.categories   add column if not exists wallet_id  uuid references public.wallets (id) on delete cascade;

-- Mỗi user đang có dữ liệu -> tạo cho họ một ví cá nhân và dồn dữ liệu vào đó.
do $$
declare
  v_user uuid;
  v_wallet uuid;
begin
  for v_user in
    select user_id from public.transactions where user_id is not null
    union
    select user_id from public.categories   where user_id is not null
  loop
    insert into public.wallets (name, owner_id, invite_code)
    values ('Ví của tôi', v_user, public.gen_invite_code())
    returning id into v_wallet;

    insert into public.wallet_members (wallet_id, user_id, role)
    values (v_wallet, v_user, 'owner');

    update public.transactions
       set wallet_id = v_wallet, created_by = v_user
     where user_id = v_user;

    update public.categories
       set wallet_id = v_wallet
     where user_id = v_user;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. BỎ POLICY CŨ (chúng tham chiếu user_id nên phải xoá trước khi drop cột)
-- ---------------------------------------------------------------------
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;

drop policy if exists "categories_select_own_or_default" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

drop index if exists public.transactions_user_occurred_idx;
drop index if exists public.categories_user_id_idx;

alter table public.transactions drop column if exists user_id;
alter table public.categories   drop column if exists user_id;

-- Giao dịch bắt buộc phải thuộc một ví.
alter table public.transactions alter column wallet_id set not null;

create index if not exists transactions_wallet_occurred_idx
  on public.transactions (wallet_id, occurred_at desc);
create index if not exists categories_wallet_idx on public.categories (wallet_id);

-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.wallets        enable row level security;
alter table public.wallet_members enable row level security;

-- Cho phép chạy lại migration này mà không lỗi "policy already exists".
drop policy if exists "wallets_select_member"        on public.wallets;
drop policy if exists "wallets_insert_self_owner"    on public.wallets;
drop policy if exists "wallets_update_owner"         on public.wallets;
drop policy if exists "wallets_delete_owner"         on public.wallets;
drop policy if exists "members_select_same_wallet"   on public.wallet_members;
drop policy if exists "members_insert_by_owner"      on public.wallet_members;
drop policy if exists "members_delete_owner_or_self" on public.wallet_members;
drop policy if exists "tx_select_member"             on public.transactions;
drop policy if exists "tx_insert_member"             on public.transactions;
drop policy if exists "tx_update_member"             on public.transactions;
drop policy if exists "tx_delete_member"             on public.transactions;
drop policy if exists "cat_select_default_or_member" on public.categories;
drop policy if exists "cat_insert_member"            on public.categories;
drop policy if exists "cat_update_member"            on public.categories;
drop policy if exists "cat_delete_member"            on public.categories;

-- wallets: thấy ví mình là thành viên. Thêm `owner_id = auth.uid()` để lúc
-- vừa INSERT ... RETURNING (chưa kịp có dòng membership) vẫn đọc được.
create policy "wallets_select_member"
  on public.wallets for select
  using (public.is_wallet_member(id) or owner_id = auth.uid());

create policy "wallets_insert_self_owner"
  on public.wallets for insert
  with check (owner_id = auth.uid());

create policy "wallets_update_owner"
  on public.wallets for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "wallets_delete_owner"
  on public.wallets for delete
  using (owner_id = auth.uid());

-- wallet_members: dùng hàm definer -> không đệ quy
create policy "members_select_same_wallet"
  on public.wallet_members for select
  using (public.is_wallet_member(wallet_id));

create policy "members_insert_by_owner"
  on public.wallet_members for insert
  with check (public.is_wallet_owner(wallet_id));

-- Chủ ví xoá được thành viên; thành viên tự rời ví được.
create policy "members_delete_owner_or_self"
  on public.wallet_members for delete
  using (public.is_wallet_owner(wallet_id) or user_id = auth.uid());

-- transactions: mọi thành viên của ví đều toàn quyền
create policy "tx_select_member"
  on public.transactions for select
  using (public.is_wallet_member(wallet_id));

create policy "tx_insert_member"
  on public.transactions for insert
  with check (public.is_wallet_member(wallet_id) and created_by = auth.uid());

create policy "tx_update_member"
  on public.transactions for update
  using (public.is_wallet_member(wallet_id))
  with check (public.is_wallet_member(wallet_id));

create policy "tx_delete_member"
  on public.transactions for delete
  using (public.is_wallet_member(wallet_id));

-- categories: wallet_id null = danh mục mặc định dùng chung, ai cũng đọc được
create policy "cat_select_default_or_member"
  on public.categories for select
  using (wallet_id is null or public.is_wallet_member(wallet_id));

create policy "cat_insert_member"
  on public.categories for insert
  with check (public.is_wallet_member(wallet_id));

create policy "cat_update_member"
  on public.categories for update
  using (public.is_wallet_member(wallet_id))
  with check (public.is_wallet_member(wallet_id));

create policy "cat_delete_member"
  on public.categories for delete
  using (public.is_wallet_member(wallet_id));

-- ---------------------------------------------------------------------
-- 7. RPC: tạo ví & tham gia ví bằng mã mời
--    Để security definer vì lúc tạo ví chưa có membership -> policy chưa cho
--    ghi wallet_members; và lúc join thì user chưa phải thành viên.
-- ---------------------------------------------------------------------
create or replace function public.create_wallet(p_name text)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_wallet public.wallets;
  v_tries  int := 0;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  -- Lặp phòng khi trùng mã mời (xác suất rất thấp).
  loop
    v_tries := v_tries + 1;
    begin
      insert into public.wallets (name, owner_id, invite_code)
      values (coalesce(nullif(trim(p_name), ''), 'Ví của tôi'), v_uid, public.gen_invite_code())
      returning * into v_wallet;
      exit;
    exception when unique_violation then
      if v_tries >= 10 then raise; end if;
    end;
  end loop;

  insert into public.wallet_members (wallet_id, user_id, role)
  values (v_wallet.id, v_uid, 'owner');

  return v_wallet;
end $$;

create or replace function public.join_wallet(p_code text)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_wallet public.wallets;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select * into v_wallet
    from public.wallets
   where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Mã mời không đúng';
  end if;

  insert into public.wallet_members (wallet_id, user_id, role)
  values (v_wallet.id, v_uid, 'member')
  on conflict (wallet_id, user_id) do nothing;

  return v_wallet;
end $$;

-- ---------------------------------------------------------------------
-- 8. QUYỀN GỌI HÀM
--    Postgres mặc định cấp EXECUTE cho PUBLIC (gồm cả role `anon`).
--    Các hàm security definer bỏ qua RLS nên phải thu hồi rồi cấp lại
--    đúng cho `authenticated`.
-- ---------------------------------------------------------------------
revoke execute on function public.is_wallet_member(uuid) from public;
revoke execute on function public.is_wallet_owner(uuid)  from public;
revoke execute on function public.create_wallet(text)    from public;
revoke execute on function public.join_wallet(text)      from public;

grant execute on function public.is_wallet_member(uuid) to authenticated;
grant execute on function public.is_wallet_owner(uuid)  to authenticated;
grant execute on function public.create_wallet(text)    to authenticated;
grant execute on function public.join_wallet(text)      to authenticated;
