-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'IN_USE');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('GOOD', 'BROKEN', 'UNDER_REPAIR', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "ten_vai_tro" VARCHAR(255) NOT NULL,
    "mo_ta" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "ten_quyen" VARCHAR(255) NOT NULL,
    "mo_ta" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "vai_tro_id" INTEGER NOT NULL,
    "quyen_han_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("vai_tro_id","quyen_han_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "ten_dang_nhap" VARCHAR(255) NOT NULL,
    "mat_khau" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "so_dien_thoai" VARCHAR(255),
    "trang_thai" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "vai_tro_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "nguoi_dung_id" INTEGER NOT NULL,
    "hanh_dong" VARCHAR(255) NOT NULL,
    "doi_tuong" VARCHAR(255) NOT NULL,
    "doi_tuong_id" INTEGER NOT NULL,
    "noi_dung" TEXT,
    "thoi_gian" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "ma_phong" VARCHAR(255) NOT NULL,
    "ten_phong" VARCHAR(255) NOT NULL,
    "toa_nha" VARCHAR(255),
    "tang" INTEGER,
    "suc_chua" INTEGER,
    "trang_thai" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" SERIAL NOT NULL,
    "ten_loai" VARCHAR(255) NOT NULL,
    "mo_ta" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" SERIAL NOT NULL,
    "ten_thiet_bi" VARCHAR(255) NOT NULL,
    "loai_thiet_bi_id" INTEGER NOT NULL,
    "don_vi_tinh" VARCHAR(255),
    "so_luong" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" "EquipmentStatus" NOT NULL DEFAULT 'GOOD',
    "mo_ta" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_allocations" (
    "id" SERIAL NOT NULL,
    "thiet_bi_id" INTEGER NOT NULL,
    "phong_hoc_id" INTEGER NOT NULL,
    "so_luong" INTEGER NOT NULL DEFAULT 0,
    "ngay_phan_bo" DATE,
    "ghi_chu" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_transfers" (
    "id" SERIAL NOT NULL,
    "thiet_bi_id" INTEGER NOT NULL,
    "phong_nguon_id" INTEGER NOT NULL,
    "phong_dich_id" INTEGER NOT NULL,
    "so_luong" INTEGER NOT NULL DEFAULT 0,
    "ngay_dieu_chuyen" DATE NOT NULL,
    "nguoi_thuc_hien_id" INTEGER NOT NULL,
    "ghi_chu" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "nguoi_gui_id" INTEGER NOT NULL,
    "phong_hoc_id" INTEGER NOT NULL,
    "thiet_bi_id" INTEGER,
    "noi_dung" TEXT NOT NULL,
    "trang_thai" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "thoi_gian_gui" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nguoi_xu_ly_id" INTEGER,
    "noi_dung_xu_ly" TEXT,
    "thoi_gian_xu_ly" TIMESTAMP(3),
    "ket_qua" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_ten_dang_nhap_key" ON "users"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_ma_phong_key" ON "rooms"("ma_phong");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_quyen_han_id_fkey" FOREIGN KEY ("quyen_han_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_loai_thiet_bi_id_fkey" FOREIGN KEY ("loai_thiet_bi_id") REFERENCES "equipment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_allocations" ADD CONSTRAINT "equipment_allocations_thiet_bi_id_fkey" FOREIGN KEY ("thiet_bi_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_allocations" ADD CONSTRAINT "equipment_allocations_phong_hoc_id_fkey" FOREIGN KEY ("phong_hoc_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_thiet_bi_id_fkey" FOREIGN KEY ("thiet_bi_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_phong_nguon_id_fkey" FOREIGN KEY ("phong_nguon_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_phong_dich_id_fkey" FOREIGN KEY ("phong_dich_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_transfers" ADD CONSTRAINT "equipment_transfers_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_nguoi_gui_id_fkey" FOREIGN KEY ("nguoi_gui_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_nguoi_xu_ly_id_fkey" FOREIGN KEY ("nguoi_xu_ly_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_phong_hoc_id_fkey" FOREIGN KEY ("phong_hoc_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_thiet_bi_id_fkey" FOREIGN KEY ("thiet_bi_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
