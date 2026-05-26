-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordCode" TEXT,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3);
