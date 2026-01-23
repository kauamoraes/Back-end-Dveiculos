import * as clientService from "../services/client.service.js";

export const create = async (req, res) => {
  const client = await clientService.createClient(req.body);
  res.status(201).json(client);
};

export const list = async (req, res) => {
  const clients = await clientService.listClients();
  return res.json(clients);
};

export const getById = async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  return res.json(client);
};

export const update = async (req, res) => {
  const client = await clientService.updateClient(
    req.params.id,
    req.body
  );
  return res.json(client);
};

export const remove = async (req, res) => {
  await clientService.deleteClient(req.params.id);
  return res.status(204).send();
};
