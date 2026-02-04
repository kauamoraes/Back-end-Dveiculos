import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma/prisma.js";

export async function criarSenha(req, res) {
  const { senha } = req.body;

  const existe = await prisma.auth.findFirst();
  if (existe) {
    return res.status(400).json({ error: "Senha já foi criada" });
  }

  const hash = await bcrypt.hash(senha, 10);

  await prisma.auth.create({
    data: { passwordHash: hash },
  });

  return res.json({ message: "Senha criada com sucesso" });
}

export async function login(req, res) {
  const { senha } = req.body;

  const auth = await prisma.auth.findFirst();
  if (!auth) {
    return res.status(400).json({ error: "Senha ainda não foi criada" });
  }

  const ok = await bcrypt.compare(senha, auth.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Senha inválida" });
  }

  const token = jwt.sign({ auth: true }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({ token });
}
