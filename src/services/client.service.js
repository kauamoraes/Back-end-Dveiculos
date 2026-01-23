import prisma from "../lib/prisma/prisma.js";

export const createClient = async (data) => {
  return prisma.client.create({
    data: {
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg,
      email: data.email,
      rua: data.rua, 
      bairro: data.bairro,
      cidade: data.cidade,
      cep: data.cep,
      celular: data.celular,
      tipo: data.tipo,
      createdAt: new Date(),
    },
  });
};

export const listClients = async () => {
  return prisma.client.findMany({
    include: {
      sales: {
        select: {
          id: true
        }
      }
    }
  });
};

export const getClientById = async (id) => {
  return prisma.client.findUnique({
    where: { id: Number(id) },
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
