/*
  Warnings:

  - You are about to drop the column `procuracaoPath` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "procuracaoPath" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataVenda" DATETIME NOT NULL,
    "valorVenda" REAL NOT NULL,
    "financiou" BOOLEAN NOT NULL,
    "banco" TEXT,
    "possuiAlienacao" BOOLEAN,
    "valorFinanciado" REAL,
    "valorEntrada" REAL,
    "valorParcela" REAL,
    "quantidadeParcelas" INTEGER,
    "diaVencimento" INTEGER,
    "observacoes" TEXT,
    "clientId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("banco", "clientId", "createdAt", "dataVenda", "diaVencimento", "financiou", "id", "observacoes", "possuiAlienacao", "quantidadeParcelas", "valorEntrada", "valorFinanciado", "valorParcela", "valorVenda", "vehicleId") SELECT "banco", "clientId", "createdAt", "dataVenda", "diaVencimento", "financiou", "id", "observacoes", "possuiAlienacao", "quantidadeParcelas", "valorEntrada", "valorFinanciado", "valorParcela", "valorVenda", "vehicleId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_vehicleId_key" ON "Sale"("vehicleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
