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

export const getPregledIsplata = async (req, res) => {
  try {
    const isplate = await BlagajnaService.getPregledIsplata();
    return res.json({ success: true, isplate });
  } catch (error) {
    console.error("getPregledIsplata error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju isplata" });
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

export const getBlagajnaStanje = async (req, res) => {
  try {
    const stanje = await BlagajnaService.getBlagajnaStanje();
    return res.json({ success: true, stanje });
  } catch (error) {
    console.error("getBlagajnaStanje error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju stanja blagajne" });
  }
};

export const otvoriBlagajnu = async (req, res) => {
  try {
    const idOperatera = req.user.sifraRadnika;
    const result = await BlagajnaService.otvoriBlagajnu({ idOperatera });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("otvoriBlagajnu error:", error);
    return res.status(500).json({ success: false, message: error.message || "Greška pri otvaranju blagajne" });
  }
};

export const zatvoriBlagajnu = async (req, res) => {
  try {
    const idOperatera = req.user.sifraRadnika;
    const { krajStvarno } = req.body;
    if (krajStvarno === undefined || krajStvarno === null) {
      return res.status(400).json({ success: false, message: "Nedostaje prebrojano stanje gotovine" });
    }
    const result = await BlagajnaService.zatvoriBlagajnu({ idOperatera, krajStvarno });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("zatvoriBlagajnu error:", error);
    return res.status(500).json({ success: false, message: error.message || "Greška pri zatvaranju blagajne" });
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
