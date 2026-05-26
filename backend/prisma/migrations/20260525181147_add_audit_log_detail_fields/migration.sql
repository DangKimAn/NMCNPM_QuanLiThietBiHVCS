-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "method" VARCHAR(10),
ADD COLUMN     "responseMessage" TEXT,
ADD COLUMN     "route" VARCHAR(500),
ADD COLUMN     "statusCode" INTEGER;
