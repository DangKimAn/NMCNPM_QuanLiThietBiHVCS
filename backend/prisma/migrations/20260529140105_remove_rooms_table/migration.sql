/*
  Warnings:

  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "equipment_allocations" DROP CONSTRAINT "equipment_allocations_roomId_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_fromRoomId_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_toRoomId_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_roomId_fkey";

-- DropTable
DROP TABLE "rooms";

-- DropEnum
DROP TYPE "RoomStatus";
