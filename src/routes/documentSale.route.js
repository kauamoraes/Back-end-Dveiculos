import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";

const app = Router();

/* ===============================
   CONTRATO WORD (DOCX)
================================ */
app.get("/sales/:id/contrato-docx", async (req, res) => {
  try {
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, vehicle: true },
    });

    if (!sale) {
      return res.status(404).json({ error: "Venda não encontrada" });
    }

    if (!sale.client || !sale.vehicle) {
      return res.status(500).json({
        error: "Venda sem cliente ou veículo associado",
      });
    }

    const templatePath = path.join(
      process.cwd(),
      "src/templates/Document.docx",
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

    const templateData = {
      nome: sale.client.nome ?? "",
      cpf: sale.client.cpf ?? "",
      rg: sale.client.rg ?? "",
      email: sale.client.email ?? "",
      rua: sale.client.rua ?? "",
      bairro: sale.client.bairro ?? "",
      cidade: sale.client.cidade ?? "",
      cep: sale.client.cep ?? "",
      celular: sale.client.celular ?? "",

      veiculo: sale.vehicle.modelo ?? "",
      marca: sale.vehicle.marca ?? "",
      modelo: sale.vehicle.modelo ?? "",
      placa: sale.vehicle.placa ?? "",
      anoModelo: sale.vehicle.anoModelo ?? "",
      cor: sale.vehicle.cor ?? "",
      renavan: sale.vehicle.renavan ?? "",
      chassi: sale.vehicle.chassi ?? "",
      km: sale.vehicle.km ?? "",

      banco: sale.banco ?? "",
      valorFinanciado: sale.valorFinanciado ?? "",
      valorVenda: sale.valorVenda ?? "",
      valorParcela: sale.valorParcela ?? "",
      quantidadeParcela: sale.quantidadeParcela ?? "",
      valorEntrada: sale.valorEntrada ?? "",
      observacoe: sale.observacoe ?? "",
      possuiAlienacao: sale.possuiAlienacao ? "sim" : "não",

      dataVenda: new Date(sale.dataVenda).toLocaleDateString("pt-BR"),
      hora: new Date(sale.dataVenda).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    doc.setData(templateData);

    try {
      doc.render();
    } catch (e) {
      console.error("Erro ao renderizar contrato:", e);
      return res.status(500).json({
        error: "Erro ao processar template",
        details: e.properties || e.message,
      });
    }

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset=utf-8",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contrato-${sale.id}.docx"`,
    );

    res.send(docxBuffer);
  } catch (err) {
    console.error("ERRO GERAL:", err);
    res.status(500).json({
      error: "Erro ao gerar contrato",
      message: err.message,
    });
  }
});

export default app;
