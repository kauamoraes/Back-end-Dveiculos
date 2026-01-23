import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";

const router = Router();

/* ===============================
   GERAR CONTRATO WORD (DOCX)
================================ */
router.get("/vehicle/:id/compra-docx", async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);

    if (!Number.isInteger(vehicleId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        sale: {
          include: {
            client: true,
            vehicle: true,
          },
        },
      },
    });

    if (!vehicle || !vehicle.sale) {
      return res.status(404).json({
        error: "Veículo não possui venda",
      });
    }

    const sale = vehicle.sale;
    const client = sale.client;

    if (client.tipo?.trim().toUpperCase() !== "COMPROU") {
      return res.status(403).json({
        error: "Cliente não é comprador",
      });
    }

    const soldVehicle = sale.vehicle;

    const templatePath = path.join(process.cwd(), "src/templates/compra.docx");

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        error: "Template não encontrado",
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

      marca: soldVehicle.marca ?? "",
      modelo: soldVehicle.modelo ?? "",
      placa: soldVehicle.placa ?? "",
      anoModelo: soldVehicle.anoModelo ?? "",
      chassi: soldVehicle.chassi ?? "",
      cor: soldVehicle.cor ?? "",
      renavan: soldVehicle.renavan ?? "",
      valorCompra: sale.valorVenda?.toFixed(2) ?? "",
      km: soldVehicle.km?.toString() ?? "",
      obs: sale.obs ?? "",
    });

    doc.render();

    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
    });
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset=utf-8",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contrato-veiculo-${vehicle.id}.docx"`,
    );

    res.send(docxBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro ao gerar contrato",
      message: err.message,
    });
  }
});

export default router;
