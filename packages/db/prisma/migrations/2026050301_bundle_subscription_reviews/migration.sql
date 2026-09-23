-- AlterTable (idempotent)
ALTER TABLE "ProductBundle" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ProductBundle" ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable (idempotent)
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductBundleReview" (
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
CREATE TABLE IF NOT EXISTS "SubscriptionPlanReview" (
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
CREATE INDEX IF NOT EXISTS "ProductBundleReview_bundleId_idx" ON "ProductBundleReview"("bundleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductBundleReview_userId_idx" ON "ProductBundleReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductBundleReview_userId_bundleId_key" ON "ProductBundleReview"("userId", "bundleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubscriptionPlanReview_planId_idx" ON "SubscriptionPlanReview"("planId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubscriptionPlanReview_userId_idx" ON "SubscriptionPlanReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlanReview_userId_planId_key" ON "SubscriptionPlanReview"("userId", "planId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductBundleReview_userId_fkey') THEN
    ALTER TABLE "ProductBundleReview" ADD CONSTRAINT "ProductBundleReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductBundleReview_bundleId_fkey') THEN
    ALTER TABLE "ProductBundleReview" ADD CONSTRAINT "ProductBundleReview_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionPlanReview_userId_fkey') THEN
    ALTER TABLE "SubscriptionPlanReview" ADD CONSTRAINT "SubscriptionPlanReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubscriptionPlanReview_planId_fkey') THEN
    ALTER TABLE "SubscriptionPlanReview" ADD CONSTRAINT "SubscriptionPlanReview_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
