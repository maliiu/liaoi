import mysql from "mysql2/promise";
import { env } from "../env";

export const accountPool = mysql.createPool({
  host: env.accountDb.host,
  port: env.accountDb.port,
  user: env.accountDb.user,
  password: env.accountDb.password,
  database: env.accountDb.database,
  connectionLimit: 5,
  waitForConnections: true
});