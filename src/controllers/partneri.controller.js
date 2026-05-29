import * as PartneriService from "../services/partneri.service.js";

export const getPartneri = async (req, res) => {
  try {
    const data = await PartneriService.getPartneri();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("getPartneri error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju partnera" });
  }
};

export const getPartneriRazni = async (req, res) => {
  try {
    const data = await PartneriService.getPartneriRazni();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("getPartneriRazni error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju raznih partnera" });
  }
};

export const getGradovi = async (req, res) => {
  try {
    const data = await PartneriService.getGradovi();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("getGradovi error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju gradova" });
  }
};

export const kreirajPartnera = async (req, res) => {
  const { sifra_partnera, naziv_partnera, adresa_partnera, id_grada } = req.body;
  if (!sifra_partnera || !naziv_partnera || !id_grada) {
    return res.status(400).json({ success: false, message: "Sifra, naziv i grad su obavezni" });
  }
  try {
    const partner = await PartneriService.kreirajPartnera(sifra_partnera, naziv_partnera, adresa_partnera ?? "", id_grada);
    return res.json({ success: true, data: partner });
  } catch (error) {
    console.error("kreirajPartnera error:", error);
    const msg = error?.message?.includes("vec postoji")
      ? "Partner sa ovom šifrom već postoji"
      : "Greška pri kreiranju partnera";
    return res.status(400).json({ success: false, message: msg });
  }
};
