import { withConnection } from "./db.service.js";

export const getKarticaPartnera = async (idPartnera) => {
  return withConnection(async (connection) => {
    const [results] = await connection.execute(
      "CALL erp_prodaja.sp_kartica_partnera(?)",
      [idPartnera]
    );
    return {
      stavke: results[0] ?? [],
      rekapitulacija: results[1]?.[0] ?? null,
    };
  });
};
