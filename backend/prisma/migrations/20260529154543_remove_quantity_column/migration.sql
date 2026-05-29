/*
  Warnings:

  - You are about to drop the column `quantity` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `equipments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "equipment_allocations" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "equipment_transfers" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "equipments" DROP COLUMN "quantity";
