import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";
import PQueue from "p-queue";
import { execFile } from "child_process";
import { error } from "console";

const router = Router();
const libreQueue = new PQueue({ concurrency: 1 });

const SOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

/* ===============================
   CONVERSÃO DOCX → PDF
================================ */
/**
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
function convertToPdf(buffer) {
  return Promise.race([
    libreQueue.add(
      () =>
        new Promise((resolve, reject) => {
          const timestamp = Date.now();
          const tempDir = path.join(process.cwd(), "temp");
          const docxPath = path.join(tempDir, `cliente_${timestamp}.docx`);
          const pdfPath = path.join(tempDir, `cliente_${timestamp}.pdf`);

          try {
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            fs.writeFileSync(docxPath, buffer);

            execFile(
              SOFFICE_PATH,
              [
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                tempDir,
                docxPath,
              ],
              { timeout: 30000 },
              (err) => {
                if (err) {
                  cleanup();
                  return reject(err);
                }

                setTimeout(() => {
                  try {
                    if (!fs.existsSync(pdfPath)) {
                      throw new Error("PDF não gerado");
                    }

                    const pdfBuffer = fs.readFileSync(pdfPath);
                    cleanup();
                    resolve(pdfBuffer);
                  } catch (e) {
                    cleanup();
                    reject(e);
                  }
                }, 500);
              },
            );
          } catch (e) {
            cleanup();
            reject(e);
          }

          function cleanup() {
            try {
              if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
              if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            } catch {}
          }
        }),
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao converter PDF")), 35000),
    ),
  ]);
}

router.get("/client/:id/procuracao-pdf", async (req, res) => {
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


    const sale = client.sales.sort(
      (a, b) => new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime()
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
      });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "<<", end: ">>" },
    });

    // 📄 Dados corretos (cliente + veículo da venda)
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

      data: new Date().toLocaleDateString("pt-BR"),
      hora: new Date().toLocaleTimeString("pt-BR", {
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
    doc.render();

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    const pdfBuffer = await convertToPdf(docxBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="procuracao-cliente-${client.id}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro ao gerar procuração",
      message: err.message,
    });
  }
});

export default router;
