import prisma from "../lib/prisma/prisma.js";

export const createVehicle = async (data) => {
  const dataCompraRaw = data.dataCompra || data.data_da_compra;
  const dataCompra =
    dataCompraRaw instanceof Date
      ? dataCompraRaw
      : dataCompraRaw
        ? new Date(dataCompraRaw)
        : undefined;

  if (dataCompraRaw && (!dataCompra || isNaN(dataCompra.getTime()))) {
    throw new Error("Invalid dataCompra date");
  }

  const anoModelo = data.anoModelo || data.ano;
  const renavan = data.renavan || data.renavam;
  const valorCompraRaw = data.valorCompra ?? data.valor_de_compra;
  const valorCompra =
    valorCompraRaw !== undefined && valorCompraRaw !== null
      ? Number(valorCompraRaw)
      : undefined;
  const km =
    data.km !== undefined && data.km !== null ? Number(data.km) : undefined;
  const documentoTipo = data.documentoTipo || data.tipo_documento;
  const clientId = data.clientId ?? data.client_id ?? data.client;

  const payload = {
    dataCompra,
    marca: data.marca,
    modelo: data.modelo,
    placa: data.placa,
    anoModelo,
    cor: data.cor,
    chassi: data.chassi,
    renavan,
    valorCompra,
    km,
    status: data.status,
    documentoTipo,
    clientId:
      clientId !== undefined && clientId !== null
        ? Number(clientId)
        : undefined,
  };

  console.debug("prisma.create payload:", payload);

  return prisma.vehicle.create({
    data: payload,
    include: {
      client: true, // 👈 já devolve cliente se criar com clientId
    },
  });
};

export const listVehicles = async () => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      client: {
        select: {
          id: true,
          nome: true,
          tipo: true,
        },
      },
      sale: {
        include: {
          client: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },
        },
      },
    },
  });

  return vehicles.map((v) => {
    const clientDireto = v.client || null;
    const clientVenda = v.sale?.client || null;
    const client = clientDireto || clientVenda;

    const tipoCliente = client?.tipo?.trim().toUpperCase() || null;

    let tipoDocumento = null;

    if (tipoCliente === "CONSIGNOU") {
      tipoDocumento = "CONSIGNOU";
    } else if (tipoCliente === "FINANCIOU - TERCEIRO") {
      tipoDocumento = "FINANCIOU - TERCEIRO";
    } else if (tipoCliente === "COMPROU") {
      tipoDocumento = "COMPROU";
    }

    return {
      id: v.id,
      marca: v.marca,
      modelo: v.modelo,
      anoModelo: v.anoModelo,
      cor: v.cor,
      dataCompra: v.dataCompra,
      placa: v.placa,
      status: v.status,
      tipoDocumento,

      // 👇 ESSENCIAL PRO SEU FRONT FUNCIONAR
      clientId: v.clientId ?? client?.id ?? null,
      client: client ?? null,
    };
  });
};

export const getVehicleById = async (id) => {
  return prisma.vehicle.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
    },
  });
};

export const updateVehicle = async (id, data) => {
  const updateData = {};

  if (data.dataCompra || data.data_da_compra) {
    const raw = data.dataCompra || data.data_da_compra;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    if (!parsed || isNaN(parsed.getTime()))
      throw new Error("Invalid dataCompra date");
    updateData.dataCompra = parsed;
  }

  if (data.marca) updateData.marca = data.marca;
  if (data.modelo) updateData.modelo = data.modelo;
  if (data.placa) updateData.placa = data.placa;
  if (data.anoModelo || data.ano)
    updateData.anoModelo = data.anoModelo || data.ano;
  if (data.cor) updateData.cor = data.cor;
  if (data.chassi) updateData.chassi = data.chassi;
  if (data.renavan || data.renavam)
    updateData.renavan = data.renavan || data.renavam;
  if (data.valorCompra || data.valor_de_compra)
    updateData.valorCompra = Number(data.valorCompra ?? data.valor_de_compra);
  if (data.km !== undefined) updateData.km = Number(data.km);
  if (data.status) updateData.status = data.status;
  if (data.documentoTipo || data.tipo_documento)
    updateData.documentoTipo = data.documentoTipo || data.tipo_documento;

  if (
    data.clientId !== undefined ||
    data.client_id !== undefined ||
    data.client !== undefined
  ) {
    updateData.clientId = Number(
      data.clientId ?? data.client_id ?? data.client,
    );
  }

  return prisma.vehicle.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      client: true,
    },
  });
};

export const deleteVehicle = async (id) => {
  return prisma.vehicle.delete({
    where: { id: Number(id) },
  });
};
