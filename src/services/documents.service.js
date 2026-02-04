import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import prisma from "../lib/prisma/prisma.js";

const OUTPUT_DIR = path.join(process.cwd(), "temp", "procuracoes");

export async function generateProcuracaoForSale(client, vehicle, sale) {
  if (!client || !vehicle || !sale) {
    throw new Error(
      "client, vehicle and sale are required to generate procuração",
    );
  }

  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "Procuracao.docx",
  );
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template não encontrado em ${templatePath}`);
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
    throw new Error(
      "Erro ao renderizar procuração: " +
        (e.message || JSON.stringify(e.properties)),
    );
  }

  const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const fileName = `procuracao-sale-${sale.id}.docx`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, docxBuffer);

  // publicPath será servido em /storage/... (server.js expõe temp/ em /storage)
  const publicPath = `/storage/procuracoes/${fileName}`;

  return { filePath, publicPath };
}
