/*
  Warnings:

  - You are about to drop the column `name` on the `permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[permissionName]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `permissionName` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "name",
ADD COLUMN     "permissionName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permissionName_key" ON "permissions"("permissionName");
