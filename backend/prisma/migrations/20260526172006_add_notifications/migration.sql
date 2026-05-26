-- CreateEnum
CREATE TYPE "NotificationTargetRole" AS ENUM ('ALL', 'ADMIN', 'MANAGER', 'TEACHER', 'STUDENT');

-- CreateTable
CREATE TABLE "notifications" (
    "notificationId" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "targetRole" "NotificationTargetRole" NOT NULL DEFAULT 'ALL',
    "senderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("notificationId","userId")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("notificationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
