import * as BlagajnaService from "../services/blagajna.service.js";

export const getRacuniPartnera = async (req, res) => {
  try {
    const idPartnera = Number(req.params.idPartnera);
    if (!idPartnera) {
      return res.status(400).json({ success: false, message: "Nedostaje ID partnera" });
    }
    const racuni = await BlagajnaService.getRacuniPartnera(idPartnera);
    return res.json({ success: true, racuni });
  } catch (error) {
    console.error("getRacuniPartnera error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju računa" });
  }
};

export const getPregledUplata = async (req, res) => {
  try {
    const uplate = await BlagajnaService.getPregledUplata();
    return res.json({ success: true, uplate });
  } catch (error) {
    console.error("getPregledUplata error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju uplata" });
  }
};

export const unosIsplate = async (req, res) => {
  try {
    const { vrsta, racunId, idPartnera, stranka, iznos, datum, biljeska } = req.body;
    const idOperatera = req.user.sifraRadnika;

    if (!vrsta || !iznos || iznos <= 0) {
      return res.status(400).json({ success: false, message: "Nedostaju obavezni podaci" });
    }

    const isplataId = await BlagajnaService.unosIsplate({
      vrsta, racunId, idPartnera, stranka, iznos, datum, biljeska, idOperatera,
    });

    return res.json({ success: true, isplataId });
  } catch (error) {
    console.error("unosIsplate error:", error);
    return res.status(500).json({ success: false, message: error.message || "Greška pri unosu isplate" });
  }
};

export const unosUplate = async (req, res) => {
  try {
    const { idPartnera, nacinPlacanja, datum, biljeska, stavke } = req.body;
    const idOperatera = req.user.sifraRadnika;

    if (!idPartnera || !nacinPlacanja || !Array.isArray(stavke) || stavke.length === 0) {
      return res.status(400).json({ success: false, message: "Nedostaju obavezni podaci" });
    }

    const uplataId = await BlagajnaService.unosUplate({
      idPartnera,
      nacinPlacanja,
      datum,
      biljeska,
      idOperatera,
      stavke,
    });

    return res.json({ success: true, uplataId });
  } catch (error) {
    console.error("unosUplate error:", error);
    return res.status(500).json({ success: false, message: error.message || "Greška pri unosu uplate" });
  }
};
