/*
  Warnings:

  - Added the required column `last_Booking_Time` to the `trips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `trips` ADD COLUMN `last_Booking_Time` DATETIME(0) NOT NULL,
    ADD COLUMN `location` VARCHAR(191) NULL;
