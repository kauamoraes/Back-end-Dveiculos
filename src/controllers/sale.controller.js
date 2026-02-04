import {
  createSale,
  listSales,
  updateSale,
  cancelSale,
} from "../services/sales.service.js";
import prisma from "../lib/prisma/prisma.js";
import { generateProcuracaoForSale } from "../services/documents.service.js";

export const createSaleController = async (req, res) => {
  try {
    const sale = await createSale(req.body);

    // gera procuração automaticamente e atualiza o registro da venda
    try {
      const client = await prisma.client.findUnique({
        where: { id: sale.clientId },
      });
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: sale.vehicleId },
      });

      const { publicPath } = await generateProcuracaoForSale(
        client,
        vehicle,
        sale,
      );

      const updated = await prisma.sale.update({
        where: { id: sale.id },
        data: { procuracaoPath: publicPath },
      });

      return res.status(201).json(updated);
    } catch (docErr) {
      // tentativa de compensação (não deixar venda sem procuração)
      try {
        await prisma.$transaction(async (tx) => {
          await tx.sale.delete({ where: { id: sale.id } });
          await tx.vehicle.update({
            where: { id: sale.vehicleId },
            data: { status: "disponivel" },
          });
        });
      } catch (rbErr) {
        console.error("Rollback falhou:", rbErr);
      }

      return res
        .status(500)
        .json({
          message: "Venda revertida: erro ao gerar procuração",
          details: docErr.message,
        });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listSalesController = async (req, res) => {
  try {
    const sales = await listSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSaleController = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await updateSale(Number(id), req.body);
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelSaleController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cancelSale(Number(id));
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
