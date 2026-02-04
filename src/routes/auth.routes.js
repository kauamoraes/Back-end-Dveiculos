import { Router } from "express";
import { criarSenha, login } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlwares/auth.middleware.js";

const router = Router();

router.post("/criar-senha", criarSenha);
router.post("/login", login);

router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Você está autenticado" });
});

export default router;
