import * as vehicleController from "../controllers/vehicles.controller.js";
import { Router } from "express";

const router = Router();

router.post("/", vehicleController.create);
router.get("/", vehicleController.list);
router.get("/:id", vehicleController.getById);
router.put("/:id", vehicleController.update);
router.delete("/:id", vehicleController.remove);

export default router;
