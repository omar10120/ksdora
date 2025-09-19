-- AlterTable
ALTER TABLE `bookings` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `trips` MODIFY `imageUrls` TEXT NULL;
