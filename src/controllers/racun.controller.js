import * as RacunService from "../services/racun.service.js";

export const kreirajRacun = async (req, res) => {
  try {
    const { idPartnera, ukupnoZaNaplatu, napomena, stavke } = req.body;
    const idOperatera = req.user.sifraRadnika;

    if (!idPartnera || !Array.isArray(stavke) || stavke.length === 0) {
      return res.status(400).json({ success: false, message: "Nedostaju obavezni podaci" });
    }

    const now = new Date();
    const godina = now.getFullYear();
    const sljedeciSeq = await RacunService.getSljedeciRacunBroj();
    const brojRacuna = `R-${godina}-${sljedeciSeq}`;
    const referentniBroj = `R-${godina}-${String(now.getTime()).slice(-5)}`;

    const idRacuna = await RacunService.kreirajRacun({
      brojRacuna,
      referentniBroj,
      idPartnera,
      ukupnoZaNaplatu,
      napomena: napomena || "",
      idOperatera,
      stavke,
    });

    return res.json({ success: true, idRacuna, brojRacuna, referentniBroj, datumRacuna: now.toISOString() });
  } catch (error) {
    console.error("kreirajRacun error:", error);
    return res.status(500).json({ success: false, message: "Greška pri kreiranju računa" });
  }
};

export const kreirajStorno = async (req, res) => {
  try {
    const { idOriginalnog, napomena } = req.body;
    const idOperatera = req.user.sifraRadnika;

    if (!idOriginalnog) {
      return res.status(400).json({ success: false, message: "Nedostaje ID originalnog računa" });
    }

    const now = new Date();
    const godina = now.getFullYear();
    const sljedeciSeq = await RacunService.getSljedeciStornoRacunBroj();
    const brojStornoRacuna = `S-${godina}-${sljedeciSeq}`;
    const datumStorna = now.toISOString().slice(0, 19).replace("T", " ");

    const idStornoRacuna = await RacunService.kreirajStorno({
      idOriginalnog,
      brojStornoRacuna,
      datumStorna,
      idOperatera,
      napomena: napomena || "",
    });

    return res.json({ success: true, idStornoRacuna, brojStornoRacuna, datumStorna: now.toISOString() });
  } catch (error) {
    console.error("kreirajStorno error:", error);
    const msg = error.sqlMessage || error.message || "Greška pri storniranju računa";
    return res.status(500).json({ success: false, message: msg });
  }
};

export const getPregledRacuna = async (_req, res) => {
  try {
    const data = await RacunService.getPregledRacuna();
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("getPregledRacuna error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju računa" });
  }
};
