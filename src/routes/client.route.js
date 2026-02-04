import { Router } from "express"
import * as clientController from "../controllers/client.controller.js"

const router = Router()

router.get("/", clientController.listClientsWithVehicles); 
router.post("/", clientController.create)
router.get("/:id", clientController.getById)
router.put("/:id", clientController.update)
router.delete("/:id", clientController.remove)


export default router
