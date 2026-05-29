import { withConnection } from "./db.service.js";

export const getPartneri = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_partnera()");
    return rows[0] ?? [];
  });
};

export const getPartneriRazni = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute("CALL erp_prodaja.sp_pregled_partnera_razni()");
    return rows[0] ?? [];
  });
};

export const getGradovi = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT id_grada, naziv_grada FROM erp_prodaja.gradovi ORDER BY naziv_grada"
    );
    return rows ?? [];
  });
};

export const kreirajPartnera = async (sifra, naziv, adresa, id_grada) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "CALL erp_prodaja.sp_kreiraj_partnera(?, ?, ?, ?)",
      [sifra, naziv, adresa, id_grada]
    );
    const partner = rows[0]?.[0] ?? null;
    if (!partner) return null;
    return {
      sifra_partnera: partner.sifra_partnera,
      naziv_partnera: partner.naziv_partnera,
      adresa_partnera: partner.adresa_partnera,
      Naziv_grada: partner.naziv_grada ?? "",
    };
  });
};
