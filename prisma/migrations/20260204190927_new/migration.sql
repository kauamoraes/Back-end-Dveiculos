/*
  Warnings:

  - You are about to drop the column `procuracaoPath` on the `Vehicle` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataCompra" DATETIME NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "anoModelo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "chassi" TEXT NOT NULL,
    "renavan" TEXT NOT NULL,
    "valorCompra" REAL NOT NULL,
    "km" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "documentoTipo" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("anoModelo", "chassi", "clientId", "cor", "createdAt", "dataCompra", "documentoTipo", "id", "km", "marca", "modelo", "placa", "renavan", "status", "valorCompra") SELECT "anoModelo", "chassi", "clientId", "cor", "createdAt", "dataCompra", "documentoTipo", "id", "km", "marca", "modelo", "placa", "renavan", "status", "valorCompra" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
