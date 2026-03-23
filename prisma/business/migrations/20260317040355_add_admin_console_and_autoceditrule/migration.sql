-- AlterTable
ALTER TABLE `User` ADD COLUMN `blacklistReason` VARCHAR(255) NULL,
    ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isBlacklisted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `trsanction` MODIFY `type` ENUM('RECHARGE', 'SEARCH_DEBIT', 'ADMIN_ADJUSTMENT', 'AUTO_CREDIT') NOT NULL;

-- CreateTable
CREATE TABLE `AutoCreditRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `intervalDays` INTEGER NOT NULL,
    `amount` BIGINT NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `lastExecutedAt` DATETIME(3) NULL,
    `createdById` INTEGER NULL,
    `updatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutoCreditRule_enabled_updatedAt_idx`(`enabled`, `updatedAt`),
    INDEX `AutoCreditRule_lastExecutedAt_idx`(`lastExecutedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AutoCreditRule` ADD CONSTRAINT `AutoCreditRule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoCreditRule` ADD CONSTRAINT `AutoCreditRule_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
