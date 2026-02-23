/*
  Warnings:

  - You are about to drop the `UserCredits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserCredits` DROP FOREIGN KEY `UserCredits_userId_fkey`;

-- DropTable
DROP TABLE `UserCredits`;
