import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";

const router = Router();

/* ===============================
   PROCURAÇÃO WORD (DOCX)
================================ */
router.get("/client/:id/procuracao-docx", async (req, res) => {
  try {
    const clientId = Number(req.params.id);

    if (!Number.isInteger(clientId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        sales: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    if (!client.sales || client.sales.length === 0) {
      return res.status(403).json({
        error: "Cliente não possui venda registrada",
      });
    }

    // Pega a venda mais recente
    const sale = client.sales.sort(
      (a, b) =>
        new Date(b.dataVenda).getTime() -
        new Date(a.dataVenda).getTime()
    )[0];

    if (!sale.vehicle) {
      return res.status(400).json({
        error: "Venda não possui veículo associado",
      });
    }

    const vehicle = sale.vehicle;

    const templatePath = path.join(
      process.cwd(),
      "src/templates/Procuracao.docx"
    );

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        error: "Template não encontrado",
        path: templatePath,
      });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "<<", end: ">>" },
    });

    const now = new Date();

    const templateData = {
      nome: client.nome ?? "",
      cpf: client.cpf ?? "",
      rg: client.rg ?? "",
      email: client.email ?? "",
      rua: client.rua ?? "",
      bairro: client.bairro ?? "",
      cidade: client.cidade ?? "",
      cep: client.cep ?? "",
      celular: client.celular ?? "",

      data: now.toLocaleDateString("pt-BR"),
      hora: now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      marca: vehicle.marca ?? "",
      modelo: vehicle.modelo ?? "",
      placa: vehicle.placa ?? "",
      anoModelo: vehicle.anoModelo ?? "",
      chassi: vehicle.chassi ?? "",
      cor: vehicle.cor ?? "",
      renavan: vehicle.renavan ?? "",
    };

    doc.setData(templateData);

    try {
      doc.render();
    } catch (e) {
      console.error("❌ Erro ao renderizar procuração:", e);
      return res.status(500).json({
        error: "Erro ao processar template",
        details: e.properties || e.message,
      });
    }

    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
    });

     res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset=utf-8",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="procuracao-cliente-${client.id}.docx"`
    );

    res.send(docxBuffer);
  } catch (err) {
    console.error("💥 ERRO GERAL:", err);
    res.status(500).json({
      error: "Erro ao gerar procuração",
      message: err.message,
    });
  }
});

export default router;
