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
