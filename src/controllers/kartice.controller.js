import * as KarticeService from "../services/kartice.service.js";

export const getKarticaPartnera = async (req, res) => {
  try {
    const idPartnera = Number(req.params.idPartnera);
    if (!idPartnera) {
      return res.status(400).json({ success: false, message: "Nedostaje ID partnera" });
    }
    const data = await KarticeService.getKarticaPartnera(idPartnera);
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error("getKarticaPartnera error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju kartice partnera" });
  }
};
