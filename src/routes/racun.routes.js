import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as RacunController from "../controllers/racun.controller.js";

const router = Router();

router.get("/pregled", verifyToken, RacunController.getPregledRacuna);
router.post("/storno", verifyToken, RacunController.kreirajStorno);
router.post("/", verifyToken, RacunController.kreirajRacun);

export default router;
