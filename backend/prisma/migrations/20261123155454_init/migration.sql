-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "targetUserId" INTEGER;

-- CreateTable
CREATE TABLE "form_configs" (
    "formConfigId" SERIAL NOT NULL,
    "formKey" VARCHAR(100) NOT NULL,
    "fieldKey" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "fieldType" VARCHAR(50) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    "placeholder" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_configs_pkey" PRIMARY KEY ("formConfigId")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_configs_formKey_fieldKey_key" ON "form_configs"("formKey", "fieldKey");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "equipment_allocations_equipmentId_idx" ON "equipment_allocations"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_allocations_roomId_idx" ON "equipment_allocations"("roomId");

-- CreateIndex
CREATE INDEX "equipment_transfers_equipmentId_idx" ON "equipment_transfers"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_transfers_fromRoomId_idx" ON "equipment_transfers"("fromRoomId");

-- CreateIndex
CREATE INDEX "equipment_transfers_toRoomId_idx" ON "equipment_transfers"("toRoomId");

-- CreateIndex
CREATE INDEX "equipment_transfers_executorId_idx" ON "equipment_transfers"("executorId");

-- CreateIndex
CREATE INDEX "equipments_categoryId_idx" ON "equipments"("categoryId");

-- CreateIndex
CREATE INDEX "equipments_status_idx" ON "equipments"("status");

-- CreateIndex
CREATE INDEX "notifications_senderId_idx" ON "notifications"("senderId");

-- CreateIndex
CREATE INDEX "notifications_targetRole_idx" ON "notifications"("targetRole");

-- CreateIndex
CREATE INDEX "notifications_targetUserId_idx" ON "notifications"("targetUserId");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_handlerId_idx" ON "reports"("handlerId");

-- CreateIndex
CREATE INDEX "reports_roomId_idx" ON "reports"("roomId");

-- CreateIndex
CREATE INDEX "reports_equipmentId_idx" ON "reports"("equipmentId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
