/*
  Warnings:

  - A unique constraint covering the columns `[bizId]` on the table `trsanction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `PaymentConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('wechat', 'alipay', 'stripe') NOT NULL,
    `displayName` VARCHAR(64) NOT NULL,
    `description` TEXT NULL,
    `icon` TEXT NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `presetAmounts` JSON NOT NULL,
    `minAmount` INTEGER NOT NULL DEFAULT 1,
    `maxAmount` INTEGER NOT NULL DEFAULT 100000,
    `publicConfig` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentConfig_provider_key`(`provider`),
    INDEX `PaymentConfig_status_sortOrder_idx`(`status`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChargeOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `amount` BIGINT NOT NULL,
    `provider` ENUM('balance', 'wechat', 'stripe', 'alipay', 'manual') NOT NULL,
    `outTradeNo` VARCHAR(64) NOT NULL,
    `externalTransactionId` VARCHAR(64) NULL,
    `paymentCredential` JSON NOT NULL,
    `status` ENUM('pending', 'processing', 'success', 'failed', 'closed') NOT NULL DEFAULT 'pending',
    `expireTime` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `transactionId` BIGINT NULL,
    `operatorId` INTEGER NULL,
    `paymentConfigId` INTEGER NULL,
    `metadata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChargeOrder_outTradeNo_key`(`outTradeNo`),
    INDEX `ChargeOrder_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `ChargeOrder_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `ChargeOrder_provider_createdAt_idx`(`provider`, `createdAt`),
    INDEX `ChargeOrder_outTradeNo_idx`(`outTradeNo`),
    INDEX `ChargeOrder_externalTransactionId_idx`(`externalTransactionId`),
    INDEX `ChargeOrder_expireTime_idx`(`expireTime`),
    UNIQUE INDEX `ChargeOrder_provider_externalTransactionId_key`(`provider`, `externalTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `trsanction_bizId_key` ON `trsanction`(`bizId`);

-- AddForeignKey
ALTER TABLE `ChargeOrder` ADD CONSTRAINT `ChargeOrder_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChargeOrder` ADD CONSTRAINT `ChargeOrder_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `trsanction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChargeOrder` ADD CONSTRAINT `ChargeOrder_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChargeOrder` ADD CONSTRAINT `ChargeOrder_paymentConfigId_fkey` FOREIGN KEY (`paymentConfigId`) REFERENCES `PaymentConfig`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
