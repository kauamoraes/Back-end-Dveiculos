import prisma from "../lib/prisma/prisma.js";

export const listClients = async () => {
  return prisma.client.findMany({
    include: {
      vehicles: true, // 🟢 isso garante que cada cliente traga seus veículos
      sales: true, // opcional, se você quiser manter vendas
    },
  });
};

export const createClient = async (data) => {
  return prisma.client.create({ data });
};

export const getClientById = async (id) => {
  return prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      vehicles: true,
      sales: true,
    },
  });
};

export const updateClient = async (id, data) => {
  return prisma.client.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteClient = async (id) => {
  return prisma.client.delete({
    where: { id: Number(id) },
  });
};

export const listClientsWithVehicles = async () => {
  const clients = await prisma.client.findMany({
    include: {
      vehicles: true, // pega todos os veículos ligados a este cliente
    },
  });

  // adiciona temVeiculo baseado em vehicles.length
  return clients.map(c => ({
    ...c,
    temVeiculo: c.vehicles.length > 0,
  }));
};