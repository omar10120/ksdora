-- AlterTable
ALTER TABLE `bookings` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `receipt_image` VARCHAR(500) NULL;
