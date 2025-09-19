-- AlterTable
ALTER TABLE `bookings` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `seat_status_idx` ON `seats`(`status`);

-- CreateIndex
CREATE INDEX `trip_status_idx` ON `seats`(`trip_id`, `status`);

-- CreateIndex
CREATE INDEX `status_idx` ON `trips`(`status`);

-- CreateIndex
CREATE INDEX `departure_time_idx` ON `trips`(`departure_time`);

-- CreateIndex
CREATE INDEX `status_departure_idx` ON `trips`(`status`, `departure_time`);
