import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";

const router = Router();

/* ===============================
   CONSIGNAÇÃO WORD (DOCX)
================================ */
router.get("/vehicle/:id/consignacao-docx", async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // 🔹 BUSCAR A VENDA PELO VEHICLE ID (CORRETO)
    const sale = await prisma.sale.findFirst({
      where: {
        vehicleId: vehicleId,
      },
      include: {
        client: true,
        vehicle: true,
      },
    });

    if (!sale) {
      return res.status(404).json({
        error: "Nenhuma venda encontrada para este veículo",
      });
    }

    const client = sale.client;
    const vehicle = sale.vehicle;

    if (!client || !vehicle) {
      return res.status(500).json({
        error: "Venda inconsistente (cliente ou veículo ausente)",
      });
    }

    if (client.tipo?.trim().toUpperCase() !== "CONSIGNOU") {
      return res.status(403).json({
        error: "Esta venda não é de consignação",
      });
    }

    const templatePath = path.join(
      process.cwd(),
      "src/templates/consignacao.docx"
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

    doc.setData({
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
      km: vehicle.km?.toString() ?? "",
      valorCompra: sale.valorVenda?.toFixed(2) ?? "",
      obs: sale.obs ?? "",
    });

    doc.render();

    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="consignacao-veiculo-${vehicle.id}.docx"`
    );

    res.send(docxBuffer);
  } catch (err) {
    console.error("💥 ERRO:", err);
    res.status(500).json({
      error: "Erro ao gerar contrato de consignação",
      message: err.message,
    });
  }
});

export default router;
