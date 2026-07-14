-- =====================================================================
-- Thứ tự hiển thị danh mục
-- Chạy SAU 0007_cafe_to_sport.sql
--
-- Thêm cột sort_order rồi gán cho danh mục mặc định theo thứ tự mong muốn.
-- Danh mục do người dùng tự tạo (wallet_id không null) giữ mặc định 100 nên
-- xếp sau, sắp theo tên.
-- =====================================================================
alter table public.categories add column if not exists sort_order int not null default 100;

update public.categories
   set sort_order = case name
     when 'Ăn uống'   then 1
     when 'Hóa đơn'   then 2
     when 'Sức khỏe'  then 3
     when 'Di chuyển' then 4
     when 'Mua sắm'   then 5
     when 'Thể thao'  then 6
     when 'Giải trí'  then 7
     when 'Lương'     then 8
     when 'Thưởng'    then 9
     when 'Đầu tư'    then 10
     else sort_order
   end
 where wallet_id is null;
