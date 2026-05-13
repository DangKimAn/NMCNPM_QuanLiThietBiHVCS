// lib/auth.ts
import bcrypt from "bcrypt";

// 1. Hàm Băm Mật Khẩu (Dùng khi Đăng ký)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Số vòng lặp để tạo độ mặn (salt). Số càng lớn càng bảo mật nhưng chạy càng chậm. 10 là mức tiêu chuẩn.
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// 2. Hàm Kiểm Tra Mật Khẩu (Dùng khi Đăng nhập)
export async function verifyPassword(plainTextPassword: string, hashedPasswordInDb: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(plainTextPassword, hashedPasswordInDb);
  return isMatch;
}