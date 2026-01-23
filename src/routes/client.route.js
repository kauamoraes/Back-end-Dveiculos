import { Router } from "express"
import * as clientController from "../controllers/client.controller.js"

const router = Router()

router.post("/", clientController.create)
router.get("/", clientController.list)
router.get("/:id", clientController.getById)
router.put("/:id", clientController.update)
router.delete("/:id", clientController.remove)

export default router
