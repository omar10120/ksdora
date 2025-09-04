-- CreateTable
CREATE TABLE `ads` (
    `id` VARCHAR(36) NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `trip_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trip_id`(`trip_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
