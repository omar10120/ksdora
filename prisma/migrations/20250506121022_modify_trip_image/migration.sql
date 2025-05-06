/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `trips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `trips` DROP COLUMN `imageUrl`,
    ADD COLUMN `imageUrls` VARCHAR(191) NULL;
