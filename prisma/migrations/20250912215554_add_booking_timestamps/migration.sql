/*
  Warnings:

  - Added the required column `updated_at` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- Update existing records to set updated_at to booking_date for existing bookings
UPDATE `bookings` SET `updated_at` = `booking_date` WHERE `updated_at` = `created_at`;
