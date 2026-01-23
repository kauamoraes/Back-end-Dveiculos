import fs from "fs";
import path from "path";
import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../prisma/client.js";
import PQueue from "p-queue";
import { execFile } from "child_process";

const router = Router();
const libreQueue = new PQueue({ concurrency: 1 });

const SOFFICE_PATH =
  process.env.SOFFICE_PATH ||
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

/* ===============================
   CONVERSÃO DOCX → PDF
================================ */
function convertToPdf(buffer) {
  return Promise.race([
    libreQueue.add(
      () =>
        new Promise((resolve, reject) => {
          const timestamp = Date.now();
          const tempDir = path.join(process.cwd(), "temp");
          const docxPath = path.join(tempDir, `consignacao_${timestamp}.docx`);
          const pdfPath = path.join(tempDir, `consignacao_${timestamp}.pdf`);

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

/* ===============================
   CONSIGNAÇÃO PDF
================================ */
router.get("/vehicle/:id/consignacao-pdf", async (req, res) => {
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
      return res.status(403).json({
        error: "Veículo não possui venda",
      });
    }

    const sale = vehicle.sale;
    const client = sale.client;

    if (sale.client.tipo.trim().toUpperCase() !== "CONSIGNOU") {
      return res.status(403).json({
        error: "Cliente não é consignação",
      });
    }

    const soldVehicle = sale.vehicle;

    const templatePath = path.join(
      process.cwd(),
      "src/templates/consignacao.docx",
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
      obs: sale.obs?.toString() ?? "",
    });

    doc.render();

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    const pdfBuffer = await convertToPdf(docxBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="consignacao-veiculo-${vehicle.id}.pdf"`,
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro ao gerar contrato de consignação",
      message: err.message,
    });
  }
});

export default router;
