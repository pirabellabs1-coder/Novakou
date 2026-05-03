-- AlterTable
ALTER TABLE "ProductBundle" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductBundleReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBundleReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlanReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBundleReview_bundleId_idx" ON "ProductBundleReview"("bundleId");

-- CreateIndex
CREATE INDEX "ProductBundleReview_userId_idx" ON "ProductBundleReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBundleReview_userId_bundleId_key" ON "ProductBundleReview"("userId", "bundleId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanReview_planId_idx" ON "SubscriptionPlanReview"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPlanReview_userId_idx" ON "SubscriptionPlanReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlanReview_userId_planId_key" ON "SubscriptionPlanReview"("userId", "planId");

-- AddForeignKey
ALTER TABLE "ProductBundleReview" ADD CONSTRAINT "ProductBundleReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBundleReview" ADD CONSTRAINT "ProductBundleReview_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanReview" ADD CONSTRAINT "SubscriptionPlanReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlanReview" ADD CONSTRAINT "SubscriptionPlanReview_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
