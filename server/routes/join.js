import { Router as createRouter } from "express";
import { joinController } from "../controllers/join/joinController.js";

const router = createRouter();

router.post("/", joinController);

export default router;
