import { withConnection } from "./db.service.js";

export const getRacuniPartnera = async (idPartnera) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT
        r.id                                                      AS id_racuna,
        r.broj_racuna,
        r.datum_racuna,
        r.ukupno_za_naplatu,
        COALESCE(SUM(s.iznos), 0)                                AS vec_placeno,
        r.ukupno_za_naplatu - COALESCE(SUM(s.iznos), 0)         AS ostatak
       FROM erp_prodaja.prodaja_racun_glavni r
       LEFT JOIN erp_prodaja.blagajna_uplate_stavke s ON s.racun_id = r.id
       WHERE r.id_partnera = ?
         AND r.status_racuna = 0
         AND r.vrsta_racuna  = 0
       GROUP BY r.id, r.broj_racuna, r.datum_racuna, r.ukupno_za_naplatu
       HAVING ostatak > 0
       ORDER BY r.datum_racuna ASC`,
      [idPartnera]
    );
    return rows;
  });
};

export const unosUplate = async ({ idPartnera, nacinPlacanja, datum, biljeska, idOperatera, stavke }) => {
  return withConnection(async (connection) => {
    const datumDb = datum
      ? new Date(datum).toISOString().slice(0, 19).replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");

    // Manual mode: no invoice linked — racun_id is NOT NULL in stavke table, so insert directly
    const isManualMode = stavke.length === 1 && stavke[0].racun_id === null;
    if (isManualMode) {
      const [result] = await connection.execute(
        `INSERT INTO erp_prodaja.blagajna_uplate
           (id_partnera, ukupan_iznos, nacin_placanja, datum, biljeska, id_operatera)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idPartnera, stavke[0].iznos, nacinPlacanja, datumDb, biljeska || null, idOperatera]
      );
      return result.insertId;
    }

    const stavkeJson = JSON.stringify(
      stavke.map((s) => ({ racun_id: s.racun_id, iznos: s.iznos }))
    );

    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_unos_uplate(?, ?, ?, ?, ?, ?)",
      [idPartnera, nacinPlacanja, datumDb, biljeska || "", idOperatera, stavkeJson]
    );

    const result = rows[0][0];
    if (result.rezultat === -1) {
      throw new Error(result.poruka);
    }
    return result.rezultat;
  });
};

export const getPregledUplata = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_uplata()");
    const rawRows = rows[0];

    const map = new Map();
    for (const row of rawRows) {
      if (!map.has(row.uplata_id)) {
        map.set(row.uplata_id, {
          uplata_id: row.uplata_id,
          datum: row.datum,
          id_partnera: row.id_partnera,
          ukupan_iznos: row.ukupan_iznos,
          nacin_placanja: row.nacin_placanja,
          biljeska: row.biljeska,
          id_operatera: row.id_operatera,
          stavke: [],
        });
      }
      if (row.stavka_id !== null) {
        map.get(row.uplata_id).stavke.push({
          stavka_id: row.stavka_id,
          racun_id: row.racun_id,
          iznos: row.stavka_iznos,
        });
      }
    }
    return Array.from(map.values());
  });
};

export const unosIsplate = async ({ vrsta, racunId, idPartnera, stranka, iznos, datum, biljeska, idOperatera }) => {
  return withConnection(async (connection) => {
    const datumDb = datum
      ? new Date(datum).toISOString().slice(0, 19).replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");

    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_unos_isplate(?, ?, ?, ?, ?, ?, ?, ?)",
      [vrsta, racunId || null, idPartnera || null, stranka || null, iznos, datumDb, biljeska || null, idOperatera]
    );

    const result = rows[0][0];
    if (result.rezultat === -1) {
      throw new Error(result.poruka);
    }
    return result.rezultat;
  });
};
