import {
  createSale,
  listSales,
  updateSale,
  cancelSale,
} from "../services/sales.service.js";

export const createSaleController = async (req, res) => {
  try {
    const sale = await createSale(req.body);
    res.status(201).json(sale);
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
