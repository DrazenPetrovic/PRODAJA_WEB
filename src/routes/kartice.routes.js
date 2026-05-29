import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as KarticeController from "../controllers/kartice.controller.js";

const router = Router();

router.get("/:idPartnera", verifyToken, KarticeController.getKarticaPartnera);

export default router;
