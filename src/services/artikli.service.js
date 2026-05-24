import { withConnection } from "./db.service.js";

export const getArtikli = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_artikala()");
    return rows[0] ?? [];
  });
};
