import * as ArtikliService from "../services/artikli.service.js";

export const getArtikli = async (req, res) => {
  try {
    const data = await ArtikliService.getArtikli();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("getArtikli error:", error);
    return res.status(500).json({ success: false, message: "Greška pri dohvatanju artikala" });
  }
};
