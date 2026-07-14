-- =====================================================================
-- Sửa ràng buộc khoá ngoại của transactions.created_by
--
-- BUG: 0002 khai báo `created_by ... on delete set null`, còn 0003 lại đặt
-- cột này NOT NULL. Hai điều kiện triệt tiêu nhau: xoá một user từng nhập
-- giao dịch sẽ khiến Postgres thử gán NULL -> vi phạm NOT NULL -> lỗi
-- "null value in column created_by violates not-null constraint".
--
-- Chọn ON DELETE RESTRICT: lịch sử tài chính của ví phải giữ nguyên, không
-- được mất dấu ai đã nhập khoản nào chỉ vì một người xoá tài khoản.
-- Muốn xoá tài khoản thì phải xử lý giao dịch của người đó trước.
--
-- Hệ quả tốt kèm theo: owner_id của wallets là ON DELETE CASCADE, nếu không
-- có RESTRICT ở đây thì xoá chủ ví sẽ quét sạch ví + toàn bộ giao dịch.
-- =====================================================================
do $$
declare
  v_conname text;
begin
  select conname into v_conname
    from pg_constraint
   where conrelid = 'public.transactions'::regclass
     and contype = 'f'
     and conkey = array[(
       select attnum from pg_attribute
        where attrelid = 'public.transactions'::regclass and attname = 'created_by'
     )::smallint];

  if v_conname is not null then
    execute format('alter table public.transactions drop constraint %I', v_conname);
  end if;
end $$;

alter table public.transactions
  add constraint transactions_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete restrict;
