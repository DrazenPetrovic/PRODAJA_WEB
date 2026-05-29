import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as PartneriController from "../controllers/partneri.controller.js";

const router = Router();

router.get("/", verifyToken, PartneriController.getPartneri);
router.get("/razni", verifyToken, PartneriController.getPartneriRazni);
router.get("/gradovi", verifyToken, PartneriController.getGradovi);
router.post("/", verifyToken, PartneriController.kreirajPartnera);

export default router;
