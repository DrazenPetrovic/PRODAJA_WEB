import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as BlagajnaController from "../controllers/blagajna.controller.js";

const router = Router();

router.get("/stanje", verifyToken, BlagajnaController.getBlagajnaStanje);
router.post("/otvori", verifyToken, BlagajnaController.otvoriBlagajnu);
router.post("/zatvori", verifyToken, BlagajnaController.zatvoriBlagajnu);
router.get("/racuni-partnera/:idPartnera", verifyToken, BlagajnaController.getRacuniPartnera);
router.get("/pregled-uplata", verifyToken, BlagajnaController.getPregledUplata);
router.get("/pregled-isplata", verifyToken, BlagajnaController.getPregledIsplata);
router.get("/pregled-blagajni", verifyToken, BlagajnaController.getPregledBlagajniLista);
router.get("/pregled-blagajni/:idBlagajne", verifyToken, BlagajnaController.getPregledBlagajnaDetalj);
router.post("/uplata", verifyToken, BlagajnaController.unosUplate);
router.post("/isplata", verifyToken, BlagajnaController.unosIsplate);

export default router;
