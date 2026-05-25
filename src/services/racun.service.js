import { withConnection } from "./db.service.js";

/**
 * Kreira novi račun u bazi kroz sp_kreiraj_racun.
 *
 * @param {object} params
 * @param {string} params.brojRacuna       - generisan broj računa (npr. "R-2026-00001")
 * @param {string} params.referentniBroj   - referentni/interni broj
 * @param {number} params.idPartnera       - numerički ID partnera
 * @param {number} params.ukupnoZaNaplatu  - ukupan iznos
 * @param {string} params.napomena         - napomena operatera (max 254 znaka)
 * @param {number} params.idOperatera      - ID operatera iz JWT tokena
 * @param {Array}  params.stavke           - [{id_artikla, kolicina, cijena, ukupno}, ...]
 * @returns {Promise<number>} id_racuna novokreiranog računa
 */
export const kreirajRacun = async ({
  brojRacuna,
  referentniBroj,
  idPartnera,
  ukupnoZaNaplatu,
  napomena,
  idOperatera,
  stavke,
}) => {
  return withConnection(async (connection) => {
    const datumRacuna = new Date().toISOString().slice(0, 19).replace("T", " ");

    const stavkeJson = JSON.stringify(
      stavke.map((s) => ({
        id_artikla: s.id_artikla,
        kolicina: s.kolicina,
        cijena: s.cijena,
        ukupno: s.ukupno,
      }))
    );

    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_kreiraj_racun(?, ?, ?, ?, ?, ?, ?, ?)",
      [
        brojRacuna,
        referentniBroj,
        datumRacuna,
        idPartnera,
        ukupnoZaNaplatu,
        napomena || "",
        idOperatera,
        stavkeJson,
      ]
    );

    // Procedura vrati SELECT v_id_racuna AS id_racuna
    return rows[0][0].id_racuna;
  });
};

export const getSljedeciRacunBroj = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COALESCE(MAX(id), 0) + 1 AS sledeci FROM erp_prodaja.prodaja_racun_glavni"
    );
    return String(rows[0].sledeci);
  });
};

export const getPregledRacuna = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_racuna()");
    return {
      zaglavlja: rows[0] ?? [],
      stavke: rows[1] ?? [],
    };
  });
};

export const getSljedeciStornoRacunBroj = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) + 1 AS sledeci FROM erp_prodaja.prodaja_racun_glavni WHERE vrsta_racuna = 1"
    );
    return String(rows[0].sledeci);
  });
};

export const kreirajStorno = async ({ idOriginalnog, brojStornoRacuna, datumStorna, idOperatera, napomena }) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_kreiraj_storno(?, ?, ?, ?, ?)",
      [idOriginalnog, brojStornoRacuna, datumStorna, idOperatera, napomena]
    );
    return rows[0][0].id_storno_racuna;
  });
};
