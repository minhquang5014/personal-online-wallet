-- =====================================================================
-- Đổi danh mục mặc định "Cà phê" -> "Thể thao"
-- Chạy SAU 0006_avatars.sql
--
-- Cập nhật TẠI CHỖ (giữ nguyên id) nên các giao dịch đang gắn "Cà phê" sẽ
-- tự đổi nhãn sang "Thể thao" mà không mất dữ liệu.
-- Chỉ đụng danh mục mặc định dùng chung (wallet_id is null).
-- =====================================================================
update public.categories
   set name = 'Thể thao',
       icon = 'basketball'
 where wallet_id is null
   and name = 'Cà phê'
   and type = 'expense';
