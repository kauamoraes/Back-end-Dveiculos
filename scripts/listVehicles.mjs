import prisma from "../src/lib/prisma/prisma.js";

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, marca: true, modelo: true, status: true },
  });
  console.log("vehicles:", vehicles);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
