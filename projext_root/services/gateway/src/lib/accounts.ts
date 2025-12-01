import type { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { accountPool } from "./accountDb";

interface AccountRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
}

export async function findAccountByUsername(username: string) {
  const [rows] = await accountPool.query<AccountRow[]>(
    "SELECT id, username, password_hash FROM accounts WHERE username = ? LIMIT 1",
    [username]
  );
  return rows[0];
}

export async function registerAccount(username: string, password: string) {
  const existing = await findAccountByUsername(username);
  if (existing) {
    throw new Error("account_exists");
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    await accountPool.query(
      "INSERT INTO accounts (username, password_hash) VALUES (?, ?)",
      [username, hash]
    );
  } catch (error: any) {
    // MySQL 唯一索引冲突也视为已存在
    if (error?.code === "ER_DUP_ENTRY") {
      throw new Error("account_exists");
    }
    throw error;
  }
}

export async function verifyAccount(username: string, password: string) {
  const account = await findAccountByUsername(username);
  if (!account) return false;
  return bcrypt.compare(password, account.password_hash);
}
