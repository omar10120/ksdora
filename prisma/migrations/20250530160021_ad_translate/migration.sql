/*
  Warnings:

  - You are about to drop the column `description` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `trips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `trips` DROP COLUMN `description`,
    DROP COLUMN `location`,
    DROP COLUMN `title`,
    ADD COLUMN `descriptionAr` VARCHAR(191) NULL,
    ADD COLUMN `descriptionEn` VARCHAR(191) NULL,
    ADD COLUMN `locationAr` VARCHAR(191) NULL,
    ADD COLUMN `locationEn` VARCHAR(191) NULL,
    ADD COLUMN `titleAr` VARCHAR(191) NULL,
    ADD COLUMN `titleEn` VARCHAR(191) NULL;
