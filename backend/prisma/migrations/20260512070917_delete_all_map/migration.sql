/*
  Warnings:

  - The primary key for the `activity_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `doi_tuong` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `doi_tuong_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `hanh_dong` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `nguoi_dung_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `noi_dung` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `thoi_gian` on the `activity_logs` table. All the data in the column will be lost.
  - The primary key for the `equipment_allocations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `ghi_chu` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `ngay_phan_bo` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `phong_hoc_id` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `so_luong` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `thiet_bi_id` on the `equipment_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `equipment_allocations` table. All the data in the column will be lost.
  - The primary key for the `equipment_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `equipment_categories` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `equipment_categories` table. All the data in the column will be lost.
  - You are about to drop the column `mo_ta` on the `equipment_categories` table. All the data in the column will be lost.
  - You are about to drop the column `ten_loai` on the `equipment_categories` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `equipment_categories` table. All the data in the column will be lost.
  - The primary key for the `equipment_transfers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `ghi_chu` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `ngay_dieu_chuyen` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `nguoi_thuc_hien_id` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `phong_dich_id` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `phong_nguon_id` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `so_luong` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `thiet_bi_id` on the `equipment_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `equipment_transfers` table. All the data in the column will be lost.
  - The primary key for the `equipments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `don_vi_tinh` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `loai_thiet_bi_id` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `mo_ta` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `so_luong` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `ten_thiet_bi` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `trang_thai` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `equipments` table. All the data in the column will be lost.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `mo_ta` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `ten_quyen` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `permissions` table. All the data in the column will be lost.
  - The primary key for the `reports` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `ket_qua` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `nguoi_gui_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `nguoi_xu_ly_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `noi_dung` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `noi_dung_xu_ly` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `phong_hoc_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `thiet_bi_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `thoi_gian_gui` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `thoi_gian_xu_ly` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `trang_thai` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `reports` table. All the data in the column will be lost.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quyen_han_id` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `vai_tro_id` on the `role_permissions` table. All the data in the column will be lost.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `mo_ta` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `ten_vai_tro` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `roles` table. All the data in the column will be lost.
  - The primary key for the `rooms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `ma_phong` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `suc_chua` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `tang` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `ten_phong` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `toa_nha` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `trang_thai` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `rooms` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `mat_khau` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `so_dien_thoai` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ten_dang_nhap` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `trang_thai` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vai_tro_id` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipmentId` to the `equipment_allocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `equipment_allocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `equipment_allocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `equipment_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `equipment_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipmentId` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executorId` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromRoomId` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toRoomId` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transferredAt` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `equipment_transfers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `equipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `equipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `equipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportContent` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporterId` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permissionId` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hashedPassword` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_nguoi_dung_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_allocations" DROP CONSTRAINT "equipment_allocations_phong_hoc_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_allocations" DROP CONSTRAINT "equipment_allocations_thiet_bi_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_nguoi_thuc_hien_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_phong_dich_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_phong_nguon_id_fkey";

-- DropForeignKey
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_thiet_bi_id_fkey";

-- DropForeignKey
ALTER TABLE "equipments" DROP CONSTRAINT "equipments_loai_thiet_bi_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_nguoi_gui_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_nguoi_xu_ly_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_phong_hoc_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_thiet_bi_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_quyen_han_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_vai_tro_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_vai_tro_id_fkey";

-- DropIndex
DROP INDEX "rooms_ma_phong_key";

-- DropIndex
DROP INDEX "users_ten_dang_nhap_key";

-- AlterTable
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pkey",
DROP COLUMN "doi_tuong",
DROP COLUMN "doi_tuong_id",
DROP COLUMN "hanh_dong",
DROP COLUMN "id",
DROP COLUMN "nguoi_dung_id",
DROP COLUMN "noi_dung",
DROP COLUMN "thoi_gian",
ADD COLUMN     "action" VARCHAR(255) NOT NULL,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "logId" SERIAL NOT NULL,
ADD COLUMN     "target" VARCHAR(255) NOT NULL,
ADD COLUMN     "targetId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("logId");

-- AlterTable
ALTER TABLE "equipment_allocations" DROP CONSTRAINT "equipment_allocations_pkey",
DROP COLUMN "created_at",
DROP COLUMN "ghi_chu",
DROP COLUMN "id",
DROP COLUMN "ngay_phan_bo",
DROP COLUMN "phong_hoc_id",
DROP COLUMN "so_luong",
DROP COLUMN "thiet_bi_id",
DROP COLUMN "updated_at",
ADD COLUMN     "allocatedAt" DATE,
ADD COLUMN     "allocationId" SERIAL NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "equipmentId" INTEGER NOT NULL,
ADD COLUMN     "note" VARCHAR(255),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "equipment_allocations_pkey" PRIMARY KEY ("allocationId");

-- AlterTable
ALTER TABLE "equipment_categories" DROP CONSTRAINT "equipment_categories_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "mo_ta",
DROP COLUMN "ten_loai",
DROP COLUMN "updated_at",
ADD COLUMN     "categoryId" SERIAL NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("categoryId");

-- AlterTable
ALTER TABLE "equipment_transfers" DROP CONSTRAINT "equipment_transfers_pkey",
DROP COLUMN "created_at",
DROP COLUMN "ghi_chu",
DROP COLUMN "id",
DROP COLUMN "ngay_dieu_chuyen",
DROP COLUMN "nguoi_thuc_hien_id",
DROP COLUMN "phong_dich_id",
DROP COLUMN "phong_nguon_id",
DROP COLUMN "so_luong",
DROP COLUMN "thiet_bi_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "equipmentId" INTEGER NOT NULL,
ADD COLUMN     "executorId" INTEGER NOT NULL,
ADD COLUMN     "fromRoomId" INTEGER NOT NULL,
ADD COLUMN     "note" VARCHAR(255),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "toRoomId" INTEGER NOT NULL,
ADD COLUMN     "transferId" SERIAL NOT NULL,
ADD COLUMN     "transferredAt" DATE NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "equipment_transfers_pkey" PRIMARY KEY ("transferId");

-- AlterTable
ALTER TABLE "equipments" DROP CONSTRAINT "equipments_pkey",
DROP COLUMN "created_at",
DROP COLUMN "don_vi_tinh",
DROP COLUMN "id",
DROP COLUMN "loai_thiet_bi_id",
DROP COLUMN "mo_ta",
DROP COLUMN "so_luong",
DROP COLUMN "ten_thiet_bi",
DROP COLUMN "trang_thai",
DROP COLUMN "updated_at",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "equipmentId" SERIAL NOT NULL,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "EquipmentStatus" NOT NULL DEFAULT 'GOOD',
ADD COLUMN     "unit" VARCHAR(255),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "equipments_pkey" PRIMARY KEY ("equipmentId");

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "mo_ta",
DROP COLUMN "ten_quyen",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "permissionId" SERIAL NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("permissionId");

-- AlterTable
ALTER TABLE "reports" DROP CONSTRAINT "reports_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "ket_qua",
DROP COLUMN "nguoi_gui_id",
DROP COLUMN "nguoi_xu_ly_id",
DROP COLUMN "noi_dung",
DROP COLUMN "noi_dung_xu_ly",
DROP COLUMN "phong_hoc_id",
DROP COLUMN "thiet_bi_id",
DROP COLUMN "thoi_gian_gui",
DROP COLUMN "thoi_gian_xu_ly",
DROP COLUMN "trang_thai",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "equipmentId" INTEGER,
ADD COLUMN     "handlerId" INTEGER,
ADD COLUMN     "reportContent" TEXT NOT NULL,
ADD COLUMN     "reportId" SERIAL NOT NULL,
ADD COLUMN     "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reporterId" INTEGER NOT NULL,
ADD COLUMN     "resolutionContent" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "result" VARCHAR(255),
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("reportId");

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "quyen_han_id",
DROP COLUMN "vai_tro_id",
ADD COLUMN     "permissionId" INTEGER NOT NULL,
ADD COLUMN     "roleId" INTEGER NOT NULL,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "mo_ta",
DROP COLUMN "ten_vai_tro",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "roleId" SERIAL NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("roleId");

-- AlterTable
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "ma_phong",
DROP COLUMN "suc_chua",
DROP COLUMN "tang",
DROP COLUMN "ten_phong",
DROP COLUMN "toa_nha",
DROP COLUMN "trang_thai",
DROP COLUMN "updated_at",
ADD COLUMN     "building" VARCHAR(255),
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "code" VARCHAR(255) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "roomId" SERIAL NOT NULL,
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("roomId");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "created_at",
DROP COLUMN "id",
DROP COLUMN "mat_khau",
DROP COLUMN "so_dien_thoai",
DROP COLUMN "ten_dang_nhap",
DROP COLUMN "trang_thai",
DROP COLUMN "updated_at",
DROP COLUMN "vai_tro_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hashedPassword" VARCHAR(255) NOT NULL,
ADD COLUMN     "phoneNumber" VARCHAR(255),
ADD COLUMN     "roleId" INTEGER NOT NULL,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" SERIAL NOT NULL,
ADD COLUMN     "username" VARCHAR(255) NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("permissionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "equipment_categories"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_allocations" ADD CONSTRAINT "equipment_allocations_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_allocations" ADD CONSTRAINT "equipment_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_fromRoomId_fkey" FOREIGN KEY ("fromRoomId") REFERENCES "rooms"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_toRoomId_fkey" FOREIGN KEY ("toRoomId") REFERENCES "rooms"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments"("equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;
