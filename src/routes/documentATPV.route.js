import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import path from "path";
import { Router } from "express";
import prisma from "../prisma/client.js";

const app = Router();

/* ===============================
   GERAR ATPV EM WORD (DOCX)
================================ */
app.get("/sales/:id/Atpv-docx", async (req, res) => {
  console.log("\n🔵 ===== GERANDO ATPV WORD =====");

  try {
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, vehicle: true },
    });

    if (!sale || !sale.client || !sale.vehicle) {
      return res.status(404).json({
        error: "Venda, cliente ou veículo não encontrados",
      });
    }

    const templatePath = path.join(process.cwd(), "src/templates/Atpv.docx");

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

    const dataVenda = sale.dataVenda ? new Date(sale.dataVenda) : new Date();

    const templateData = {
      nome: sale.client.nome ?? "",
      cpf: sale.client.cpf ?? "",
      rg: sale.client.rg ?? "",
      email: sale.client.email ?? "",
      celular: sale.client.celular ?? "",
      cep: sale.client.cep ?? "",
      rua: sale.client.rua ?? "",
      bairro: sale.client.bairro ?? "",
      cidade: sale.client.cidade ?? "",

      marca: sale.vehicle.marca ?? "",
      modelo: sale.vehicle.modelo ?? "",
      placa: sale.vehicle.placa ?? "",
      anoModelo: sale.vehicle.anoModelo ?? "",
      cor: sale.vehicle.cor ?? "",
      renavan: sale.vehicle.renavan ?? "",
      chassi: sale.vehicle.chassi ?? "",
      km: sale.vehicle.km?.toString() ?? "",

      banco: sale.banco ?? "",
      valorVenda: sale.valorVenda ?? "",
      valorEntrada: sale.valorEntrada ?? "",
      valorFinanciado: sale.valorFinanciado ?? "",
      valorParcela: sale.valorParcela ?? "",
      quantidadeParcela: sale.quantidadeParcela ?? "",

      dataVenda: dataVenda.toLocaleDateString("pt-BR"),
      hora: dataVenda.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      observacoe: sale.observacoe ?? "",
      possuiAlienacao: sale.possuiAlienacao ? "sim" : "não",
    };

    doc.setData(templateData);

    try {
      doc.render();
    } catch (e) {
      console.error("❌ Erro ao renderizar ATPV:", e);
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
      `attachment; filename="ATPV-${sale.id}.docx"`,
    );

    res.send(docxBuffer);

    console.log("✅ ATPV Word enviado com sucesso");
  } catch (err) {
    console.error("💥 ERRO GERAL:", err);
    res.status(500).json({
      error: "Erro ao gerar ATPV",
      message: err.message,
    });
  }
});

export default app;
