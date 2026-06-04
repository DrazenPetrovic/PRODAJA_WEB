import { withConnection } from "./db.service.js";

const fmtLocalDatetime = (date) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
};

// Combines user-picked date with current wall-clock time so blagajna session comparisons work correctly.
const fmtDatumSaTrenutnimVremenom = (datum) => {
  const now = new Date();
  if (!datum) return fmtLocalDatetime(now);
  const d = new Date(datum);
  if (isNaN(d.getTime())) return fmtLocalDatetime(now);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return fmtLocalDatetime(d);
};

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
      [idPartnera],
    );
    return rows;
  });
};

export const unosUplate = async ({
  idPartnera,
  nacinPlacanja,
  datum,
  biljeska,
  idOperatera,
  stavke,
  idBlagajne,
}) => {
  return withConnection(async (connection) => {
    const datumDb = fmtDatumSaTrenutnimVremenom(datum);

    // Manual mode: no invoice linked — racun_id is NOT NULL in stavke table, so insert directly
    const isManualMode = stavke.length === 1 && stavke[0].racun_id === null;
    if (isManualMode) {
      const [result] = await connection.execute(
        `INSERT INTO erp_prodaja.blagajna_uplate
           (id_partnera, ukupan_iznos, nacin_placanja, datum, biljeska, id_operatera, id_blagajne)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idPartnera,
          stavke[0].iznos,
          nacinPlacanja,
          datumDb,
          biljeska || null,
          idOperatera,
          idBlagajne || null,
        ],
      );
      return result.insertId;
    }

    const stavkeJson = JSON.stringify(
      stavke.map((s) => ({ racun_id: s.racun_id, iznos: s.iznos })),
    );

    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_unos_uplate(?, ?, ?, ?, ?, ?, ?)",
      [
        idPartnera,
        nacinPlacanja,
        datumDb,
        biljeska || "",
        idOperatera,
        stavkeJson,
        idBlagajne || null,
      ],
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
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_pregled_uplata()",
    );

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
          naziv_operatera: row.naziv_operatera ?? null,
          id_blagajne: row.id_blagajne ?? null,
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

export const getPregledIsplata = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_pregled_isplata()",
    );
    return rows[0];
  });
};

export const getBlagajnaStanje = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(`
      SELECT bs.*,
        ro.Naziv_radnika AS naziv_operatera_otvaranje,
        rz.Naziv_radnika AS naziv_operatera_zatvaranje
      FROM erp_prodaja.blagajna_stanje bs
      LEFT JOIN ziralni.radnici ro ON ro.sifra_radnika = bs.id_operatera_otvaranje
      LEFT JOIN ziralni.radnici rz ON rz.sifra_radnika = bs.id_operatera_zatvaranje
      ORDER BY bs.id DESC
      LIMIT 1
    `);

    if (rows.length === 0) return null;
    const stanje = rows[0];

    if (stanje.status === "otvorena") {
      // datum_otvaranja may be a Date object from mysql2 — convert to local string to avoid UTC serialization mismatch
      const datumOtvaranja =
        stanje.datum_otvaranja instanceof Date
          ? fmtLocalDatetime(stanje.datum_otvaranja)
          : String(stanje.datum_otvaranja);

      const [[uplateRow]] = await connection.execute(
        `SELECT IFNULL(SUM(ukupan_iznos), 0) AS ukupno FROM erp_prodaja.blagajna_uplate WHERE datum >= ?`,
        [datumOtvaranja],
      );
      const [[isplateRow]] = await connection.execute(
        `SELECT IFNULL(SUM(iznos), 0) AS ukupno FROM erp_prodaja.blagajna_isplate WHERE datum >= ?`,
        [datumOtvaranja],
      );

      stanje.tekuce_uplate = Number(uplateRow.ukupno);
      stanje.tekuce_isplate = Number(isplateRow.ukupno);
      stanje.tekuci_obracun =
        Number(stanje.pocetak_gotovine) +
        Number(uplateRow.ukupno) -
        Number(isplateRow.ukupno);
    }

    return stanje;
  });
};

export const otvoriBlagajnu = async ({ idOperatera }) => {
  return withConnection(async (connection) => {
    const now = fmtLocalDatetime(new Date());
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_otvori_blagajnu(?, ?)",
      [idOperatera, now],
    );
    const result = rows[0][0];
    if (result.rezultat === -1) throw new Error(result.poruka);
    return result;
  });
};

export const zatvoriBlagajnu = async ({ idOperatera, krajStvarno }) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_zatvori_blagajnu(?, ?)",
      [idOperatera, krajStvarno],
    );
    const result = rows[0][0];
    if (result.rezultat === -1) throw new Error(result.poruka);
    return result;
  });
};

export const unosIsplate = async ({
  vrsta,
  racunId,
  idPartnera,
  stranka,
  iznos,
  datum,
  biljeska,
  idOperatera,
  idBlagajne,
}) => {
  return withConnection(async (connection) => {
    const datumDb = fmtDatumSaTrenutnimVremenom(datum);

    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_unos_isplate(?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        vrsta,
        racunId || null,
        idPartnera || null,
        stranka || null,
        iznos,
        datumDb,
        biljeska || null,
        idOperatera,
        idBlagajne || null,
      ],
    );

    const result = rows[0][0];
    if (result.rezultat === -1) {
      throw new Error(result.poruka);
    }
    return result.rezultat;
  });
};

export const getPregledBlagajniLista = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_pregled_blagajne_lista()",
    );
    return rows[0];
  });
};

export const getPregledBlagajnaDetalj = async (idBlagajne) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_pregled_blagajna_detalj(?)",
      [idBlagajne],
    );
    return {
      blagajna: rows[0][0] ?? null,
      uplate: rows[1] ?? [],
      isplate: rows[2] ?? [],
    };
  });
};
