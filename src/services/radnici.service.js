import { withConnection } from "./db.service.js";

export const getAktivniRadniciNalogodavci = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_pregled_aktivnih_radnika_nalogodavci()"
    );
    return rows[0] ?? [];
  });
};
