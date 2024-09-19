/*
  Warnings:

  - You are about to drop the column `updaatedAT` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAT` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "updaatedAT",
ADD COLUMN     "updatedAT" TIMESTAMP(3) NOT NULL;
