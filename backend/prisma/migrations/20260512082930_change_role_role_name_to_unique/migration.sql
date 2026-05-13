/*
  Warnings:

  - A unique constraint covering the columns `[roleName]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "roles_roleName_key" ON "roles"("roleName");
