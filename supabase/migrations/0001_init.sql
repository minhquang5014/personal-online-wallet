-- =====================================================================
-- Personal Finance Management — Schema khởi tạo
-- Chạy: dán toàn bộ file này vào Supabase Dashboard → SQL Editor → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BẢNG categories
--    user_id = NULL  -> danh mục mặc định dùng chung (read-only cho mọi user)
--    user_id = <uid> -> danh mục do user tự tạo
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  name       text not null,
  icon       text not null,               -- tên icon Ionicons, vd 'fast-food'
  color      text not null,               -- mã màu hex, vd '#F97316'
  type       text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------------
-- 2. BẢNG transactions
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount      numeric(14, 2) not null check (amount > 0),  -- luôn dương
  type        text not null check (type in ('income', 'expense')),
  note        text not null default '',
  occurred_at timestamptz not null default now(),          -- thời điểm giao dịch
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    Bắt buộc: mỗi user chỉ thao tác được trên dữ liệu của mình.
-- ---------------------------------------------------------------------
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

-- categories: đọc được danh mục của mình + danh mục mặc định (user_id null)
create policy "categories_select_own_or_default"
  on public.categories for select
  using (user_id is null or user_id = auth.uid());

-- categories: chỉ thêm/sửa/xóa danh mục của chính mình
create policy "categories_insert_own"
  on public.categories for insert
  with check (user_id = auth.uid());

create policy "categories_update_own"
  on public.categories for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories_delete_own"
  on public.categories for delete
  using (user_id = auth.uid());

-- transactions: toàn quyền trên dữ liệu của chính mình
create policy "transactions_select_own"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (user_id = auth.uid());

create policy "transactions_update_own"
  on public.transactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "transactions_delete_own"
  on public.transactions for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. SEED danh mục mặc định (user_id = NULL, dùng chung)
--    Khớp với dữ liệu mẫu trong lib/mockData.ts
-- ---------------------------------------------------------------------
insert into public.categories (user_id, name, icon, color, type) values
  (null, 'Ăn uống',    'fast-food',        '#F97316', 'expense'),
  (null, 'Di chuyển',  'car',              '#0EA5E9', 'expense'),
  (null, 'Mua sắm',    'bag-handle',       '#EC4899', 'expense'),
  (null, 'Hóa đơn',    'receipt',          '#8B5CF6', 'expense'),
  (null, 'Cà phê',     'cafe',             '#A16207', 'expense'),
  (null, 'Sức khỏe',   'medkit',           '#EF4444', 'expense'),
  (null, 'Giải trí',   'game-controller',  '#14B8A6', 'expense'),
  (null, 'Lương',      'cash',             '#16A34A', 'income'),
  (null, 'Thưởng',     'gift',             '#22C55E', 'income'),
  (null, 'Đầu tư',     'trending-up',      '#0D9488', 'income')
on conflict do nothing;
