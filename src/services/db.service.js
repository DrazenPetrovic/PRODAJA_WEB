import mysql from "mysql2/promise";
import { dbConfig } from "../config/db.js";

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const withConnection = async (fn) => {
  const connection = await pool.getConnection();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
};
