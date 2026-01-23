import * as vehicleService from "../services/vehicles.service.js";

export const create = async (req, res) => {
  try {
    const body = req.body || {};

    const alt = {
      dataCompra: "data_da_compra",
      anoModelo: "ano",
      renavan: "renavam",
      valorCompra: "valor_de_compra",
      documentoTipo: "tipo_documento",
      clientId: "client_id",
    };

    const required = [
      "dataCompra",
      "marca",
      "modelo",
      "placa",
      "anoModelo",
      "cor",
      "chassi",
      "renavan",
      "valorCompra",
      "km",
      "status",
      "documentoTipo",
      "clientId",
    ];

    const missing = required.filter((key) => {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "")
        return false;
      const a = alt[key];
      if (a && body[a] !== undefined && body[a] !== null && body[a] !== "")
        return false;
      return true;
    });

    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: "Missing required fields", missing });
    }

    const candidateDate = body.dataCompra || body.data_da_compra;
    const parsedDate = candidateDate ? new Date(candidateDate) : null;
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date for dataCompra", field: "dataCompra" });
    }
    body.dataCompra = parsedDate;

    const vehicle = await vehicleService.createVehicle(body);
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message)
      return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const list = async (req, res) => {
  const vehicles = await vehicleService.listVehicles();
  return res.json(vehicles);
};

export const getById = async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  return res.json(vehicle);
};

export const update = async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
  return res.json(vehicle);
};

export const remove = async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id);
  return res.status(204).send();
};
