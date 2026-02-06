import {
  createSale,
  listSales,
  updateSale,
  cancelSale,
} from "../services/sales.service.js";

export const createSaleController = async (req, res) => {
  try {
    const sale = await createSale(req.body);
    return res.status(201).json(sale);
  } catch (error) {
    console.error("Erro ao criar venda:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const listSalesController = async (req, res) => {
  try {
    const sales = await listSales();
    return res.json(sales);
  } catch (error) {
    console.error("Erro ao listar vendas:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateSaleController = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await updateSale(Number(id), req.body);
    return res.json(sale);
  } catch (error) {
    console.error("Erro ao atualizar venda:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const cancelSaleController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cancelSale(Number(id));
    return res.json(result);
  } catch (error) {
    console.error("Erro ao cancelar venda:", error);
    return res.status(400).json({ message: error.message });
  }
};
