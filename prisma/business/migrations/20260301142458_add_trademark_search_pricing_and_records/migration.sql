-- CreateTable
CREATE TABLE `SearchPrice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` ENUM('TRADEMARK_IMAGE_SEARCH') NOT NULL,
    `userId` INTEGER NULL,
    `amount` BIGINT NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SearchPrice_code_enabled_idx`(`code`, `enabled`),
    INDEX `SearchPrice_userId_idx`(`userId`),
    UNIQUE INDEX `SearchPrice_code_userId_key`(`code`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trsanction` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NOT NULL,
    `type` ENUM('RECHARGE', 'SEARCH_DEBIT', 'ADMIN_ADJUSTMENT') NOT NULL,
    `amount` BIGINT NOT NULL,
    `balanceBefore` BIGINT NOT NULL,
    `balanceAfter` BIGINT NOT NULL,
    `description` VARCHAR(255) NULL,
    `bizId` VARCHAR(64) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trsanction_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `trsanction_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `trsanction_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrademarkSearchRecord` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountId` INTEGER NOT NULL,
    `searchPriceId` INTEGER NULL,
    `transactionId` BIGINT NULL,
    `requestId` VARCHAR(64) NULL,
    `status` ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    `searchPriceAmount` BIGINT NOT NULL,
    `queryImageObjectKey` VARCHAR(1024) NOT NULL,
    `queryImageUrl` VARCHAR(2048) NOT NULL,
    `queryImageSha256` VARCHAR(64) NOT NULL,
    `queryImageMimeType` VARCHAR(128) NOT NULL,
    `queryImageSize` INTEGER NOT NULL,
    `queryVector` JSON NOT NULL,
    `vectorProvider` VARCHAR(128) NOT NULL,
    `vectorModel` VARCHAR(255) NOT NULL,
    `vectorDimension` INTEGER NOT NULL,
    `vectorLatencyMs` INTEGER NULL,
    `milvusCollection` VARCHAR(255) NOT NULL,
    `milvusTopK` INTEGER NOT NULL,
    `milvusLatencyMs` INTEGER NULL,
    `milvusResultCount` INTEGER NOT NULL DEFAULT 0,
    `milvusResults` JSON NOT NULL,
    `matchedSerialNums` JSON NOT NULL,
    `matchedRecords` JSON NOT NULL,
    `responseItems` JSON NOT NULL,
    `resultCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `TrademarkSearchRecord_requestId_key`(`requestId`),
    INDEX `TrademarkSearchRecord_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `TrademarkSearchRecord_accountId_createdAt_idx`(`accountId`, `createdAt`),
    INDEX `TrademarkSearchRecord_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SearchPrice` ADD CONSTRAINT `SearchPrice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trsanction` ADD CONSTRAINT `trsanction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trsanction` ADD CONSTRAINT `trsanction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrademarkSearchRecord` ADD CONSTRAINT `TrademarkSearchRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrademarkSearchRecord` ADD CONSTRAINT `TrademarkSearchRecord_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrademarkSearchRecord` ADD CONSTRAINT `TrademarkSearchRecord_searchPriceId_fkey` FOREIGN KEY (`searchPriceId`) REFERENCES `SearchPrice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrademarkSearchRecord` ADD CONSTRAINT `TrademarkSearchRecord_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `trsanction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
