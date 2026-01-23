import { Router } from "express";
import {
  createSaleController,
  listSalesController,
  updateSaleController,
  cancelSaleController
} from "../controllers/sale.controller.js";

const saleRoutes = Router();

saleRoutes.post("/", createSaleController);      
saleRoutes.get("/", listSalesController);        
saleRoutes.put("/:id", updateSaleController);   
saleRoutes.delete("/:id", cancelSaleController);

export default saleRoutes;
