import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import path from "path";
import { Router } from "express";
import prisma from "../prisma/client.js";
import PQueue from "p-queue";
import { execFile } from "child_process";

const app = Router();
const libreQueue = new PQueue({ concurrency: 1 });

const SOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

function convertToPdf(buffer) {
  return Promise.race([
    libreQueue.add(
      () =>
        new Promise((resolve, reject) => {
          const timestamp = Date.now();
          const tempDir = path.join(process.cwd(), "temp");
          const tempDocxPath = path.join(tempDir, `temp_${timestamp}.docx`);
          const tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);

          try {
            // Criar pasta temp se não existir
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            // Salvar DOCX temporário
            fs.writeFileSync(tempDocxPath, buffer);
            console.log("📝 Arquivo temporário salvo:", tempDocxPath);

            // Converter usando soffice diretamente
            execFile(
              SOFFICE_PATH,
              [
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                tempDir,
                tempDocxPath,
              ],
              { timeout: 30000 },
              (err, stdout, stderr) => {
                if (err) {
                  console.error("❌ Erro ao converter:", err.message);
                  console.error("stderr:", stderr);
                  // Limpar arquivos
                  try {
                    fs.unlinkSync(tempDocxPath);
                    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
                  } catch (e) {}
                  reject(err);
                  return;
                }

                setTimeout(() => {
                  try {
                    if (fs.existsSync(tempPdfPath)) {
                      const pdfBuffer = fs.readFileSync(tempPdfPath);
                      console.log("✅ LibreOffice converteu com sucesso");

                      // Limpar arquivos
                      fs.unlinkSync(tempDocxPath);
                      fs.unlinkSync(tempPdfPath);

                      resolve(pdfBuffer);
                    } else {
                      throw new Error("Arquivo PDF não foi gerado");
                    }
                  } catch (e) {
                    console.error("❌ Erro ao ler PDF:", e.message);
                    // Limpar arquivos
                    try {
                      fs.unlinkSync(tempDocxPath);
                      if (fs.existsSync(tempPdfPath))
                        fs.unlinkSync(tempPdfPath);
                    } catch (x) {}
                    reject(e);
                  }
                }, 500);
              }
            );
          } catch (e) {
            console.error("❌ Erro ao salvar arquivo temp:", e);
            reject(e);
          }
        })
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao converter PDF")), 35000)
    ),
  ]);
}

app.get("/sales/:id/Atpv-pdf", async (req, res) => {
  console.log("\n🔵 ===== INICIANDO GERAÇÃO DE CONTRATO =====");

  try {
    const saleId = Number(req.params.id);
    console.log("🔍 ID recebido:", saleId);

    if (!Number.isInteger(saleId)) {
      console.log("ID inválido");
      return res.status(400).json({ error: "ID inválido" });
    }

    console.log("📡 Buscando venda no banco...");
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { client: true, vehicle: true },
    });

    if (!sale) {
      console.log(" Venda não encontrada");
      return res.status(404).json({ error: "Venda não encontrada" });
    }

    if (!sale.client) {
      console.log("Venda sem cliente");
      return res.status(500).json({ error: "Venda sem cliente associado" });
    }

    const templatePath = path.join(
      process.cwd(),
      "src/templates/Atpv.docx"
    );
    console.log("📄 Caminho do template:", templatePath);
    console.log("📄 Template existe?", fs.existsSync(templatePath));

    if (!fs.existsSync(templatePath)) {
      console.log("❌ Template não encontrado em:", templatePath);
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
      delimiters: {
        start: "<<",
        end: ">>",
      },
    });

    const templateData = {
      nome: sale.client?.nome ?? "",
      cpf: sale.client?.cpf ?? "",
      email: sale.client.rg ?? "",
      rg: sale.client?.rg ?? "",
      veiculo: sale.vehicle?.modelo ?? "",
      placa: sale.vehicle?.placa ?? "",
      cep: sale.client.cep ?? "",
      celular: sale.client.celular ?? "",
      rua: sale.client.rua ?? "",
      bairro: sale.client.bairro ?? "",
      cidade: sale.client.cidade ?? "",
      marca: sale.vehicle.marca ?? "",
      modelo: sale.vehicle.modelo ?? "",
      anoModelo: sale.vehicle.anoModelo ?? "",
      cor: sale.vehicle.cor ?? "",
      renavan: sale.vehicle.renavan ?? "",
      chassi: sale.vehicle.chassi ?? "",
      km: sale.vehicle.km ?? "",
      dataVenda: new Date(sale.dataVenda ?? "").toLocaleDateString("pt-BR"),
      banco: sale.banco ?? "",
      valorFinanciado: sale.valorFinanciado ?? "",
      valorVenda: sale.valorVenda ?? "",
      valorParcela: sale.valorParcela ?? "",
      quantidadeParcela: sale.quantidadeParcela ?? "",
      valorEntrada: sale.valorEntrada ?? "",
      hora: new Date(sale.dataVenda).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      observacoe: sale.observacoe ?? "",
      possuiAlienacao: sale.possuiAlienacao === true ? "sim" : "não",
    };

    console.log("💉 Dados para o template:", templateData);

    doc.setData(templateData);

    try {
      doc.render();
      console.log("✅ Template renderizado");
      console.log(
        "📋 Placeholders encontrados no template:",
        doc.getFullText()
      );
    } catch (e) {
      console.error("❌ Erro ao renderizar template:", e);
      console.error("Detalhes:", e.properties);
      return res.status(500).json({
        error: "Erro ao processar template",
        details: e.properties || e.message,
      });
    }

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    console.log("📝 DOCX gerado:", docxBuffer.length, "bytes");

    if (docxBuffer.length === 0) {
      console.error("❌ Buffer DOCX está vazio!");
      return res.status(500).json({ error: "Erro: DOCX vazio gerado" });
    }

    console.log("🔄 Convertendo para PDF...");
    const pdfBuffer = await convertToPdf(docxBuffer);
    console.log("✅ PDF gerado:", pdfBuffer.length, "bytes");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contrato-${sale.id}.pdf"`
    );
    res.send(pdfBuffer);

    console.log("✅ PDF enviado com sucesso!");
    console.log("🔵 ===== FIM =====\n");
  } catch (err) {
    console.error("💥 ERRO GERAL:", err);
    console.error("Stack:", err.stack);
    res.status(500).json({
      error: "Erro ao gerar contrato",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

export default app;
