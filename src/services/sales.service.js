import prisma from "../lib/prisma/prisma.js";

// CREATE
export const createSale = async (data) => {
  return prisma.$transaction(async (tx) => {
    const rawVehicleId = data.vehicleId ?? data.vehicle_id ?? data.vehicle;
    if (rawVehicleId === undefined || rawVehicleId === null) {
      throw new Error("vehicleId is required");
    }

    const vehicleId = Number(rawVehicleId);
    if (Number.isNaN(vehicleId)) throw new Error("Invalid vehicleId");

    const vehicle = await tx.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    const rawStatus = vehicle.status ?? "";
    const statusNormalized = String(rawStatus)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    const soldStatuses = ["VENDIDO", "SOLD"];
    if (soldStatuses.includes(statusNormalized)) {
      throw new Error("Veículo indisponível");
    }

    const sale = await tx.sale.create({
      data: {
        dataVenda: data.dataVenda,
        valorVenda: data.valorVenda,
        financiou: data.financiou,
        banco: data.banco,
        possuiAlienacao: data.possuiAlienacao,
        valorFinanciado: data.valorFinanciado,
        valorEntrada: data.valorEntrada,
        valorParcela: data.valorParcela,
        quantidadeParcelas: data.quantidadeParcelas,
        diaVencimento: data.diaVencimento,
        observacoes: data.observacoes,
        clientId: data.clientId,
        vehicleId: vehicleId, // garante número
      },
    });

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "vendido" },
    });

    return sale;
  });
};

// LIST
export const listSales = async () => {
  return prisma.sale.findMany({
    include: {
      client: true,
      vehicle: true,
    },
    orderBy: {
      dataVenda: "desc",
    },
  });
};

// UPDATE (edição controlada)
export const updateSale = async (id, data) => {
  return prisma.sale.update({
    where: { id },
    data: {
      valorVenda: data.valorVenda,
      financiou: data.financiou,
      banco: data.banco,
      possuiAlienacao: data.possuiAlienacao,
      valorFinanciado: data.valorFinanciado,
      valorEntrada: data.valorEntrada,
      valorParcela: data.valorParcela,
      quantidadeParcelas: data.quantidadeParcelas,
      diaVencimento: data.diaVencimento,
      observacoes: data.observacoes,
    },
  });
};

// DELETE = CANCELAR VENDA
export const cancelSale = async (id) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    await tx.sale.delete({
      where: { id },
    });

    await tx.vehicle.update({
      where: { id: sale.vehicleId },
      data: { status: "disponivel" },
    });

    return { message: "Venda cancelada com sucesso" };
  });
};
