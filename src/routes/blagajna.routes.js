import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as BlagajnaController from "../controllers/blagajna.controller.js";

const router = Router();

router.get("/racuni-partnera/:idPartnera", verifyToken, BlagajnaController.getRacuniPartnera);
router.get("/pregled-uplata", verifyToken, BlagajnaController.getPregledUplata);
router.post("/uplata", verifyToken, BlagajnaController.unosUplate);
router.post("/isplata", verifyToken, BlagajnaController.unosIsplate);

export default router;
