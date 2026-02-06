import express from "express";
import cors from "cors";
import path from "path";

import vehicleRoutes from "./src/routes/vehicle.route.js";
import clientRoutes from "./src/routes/client.route.js";
import saleRoutes from "./src/routes/sale.route.js";
import documentAtpvRoutes from "./src/routes/documentATPV.route.js";
import doucmentVendaRoutes from "./src/routes/documentSale.route.js";
import documentProcuracao from "./src/routes/documentProcuracao.route.js";
import documentConsignacao from "./src/routes/documentConsignacao.route.js";
import documentFinanciamento from "./src/routes/documentFinanciamento.route.js";
import documentCompra from "./src/routes/documentCompra.route.js";
import authRoutes from "./src/routes/auth.routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*'
}));

app.use(express.json());

// expose generated docs (e.g. temp/procuracoes) at /storage/*
app.use("/storage", express.static(path.join(process.cwd(), "temp")));

app.use("/client", clientRoutes);
app.use("/vehicle", vehicleRoutes);
app.use("/sales", saleRoutes);

app.use("/", documentAtpvRoutes);
app.use("/", doucmentVendaRoutes);
app.use("/", documentProcuracao);
app.use("/", documentConsignacao);
app.use("/", documentFinanciamento);
app.use("/", documentCompra);
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log("API rodando na porta " + port);
});
