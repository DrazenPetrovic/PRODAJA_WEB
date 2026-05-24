import { withConnection } from "./db.service.js";

export const getPartneri = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_partnera()");
    return rows[0] ?? [];
  });
};
