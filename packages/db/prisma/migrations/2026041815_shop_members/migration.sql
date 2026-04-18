-- Collaborateurs par boutique : plusieurs users peuvent être membres d'une boutique

-- Enum des rôles
CREATE TYPE "ShopMemberRole" AS ENUM ('OWNER', 'MANAGER', 'EDITOR');

-- Membres (liaison user ↔ shop)
CREATE TABLE "ShopMember" (
  "id"        TEXT NOT NULL,
  "shopId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "role"      "ShopMemberRole" NOT NULL DEFAULT 'EDITOR',
  "invitedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShopMember_shopId_userId_key" ON "ShopMember"("shopId", "userId");
CREATE INDEX "ShopMember_userId_idx" ON "ShopMember"("userId");
CREATE INDEX "ShopMember_shopId_role_idx" ON "ShopMember"("shopId", "role");
ALTER TABLE "ShopMember" ADD CONSTRAINT "ShopMember_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopMember" ADD CONSTRAINT "ShopMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invitations (avec token unique envoyé par email)
CREATE TABLE "ShopInvitation" (
  "id"         TEXT NOT NULL,
  "shopId"     TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "role"       "ShopMemberRole" NOT NULL DEFAULT 'EDITOR',
  "inviteCode" TEXT NOT NULL,
  "invitedBy"  TEXT,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShopInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShopInvitation_inviteCode_key" ON "ShopInvitation"("inviteCode");
CREATE INDEX "ShopInvitation_email_idx" ON "ShopInvitation"("email");
CREATE INDEX "ShopInvitation_inviteCode_idx" ON "ShopInvitation"("inviteCode");
CREATE INDEX "ShopInvitation_shopId_idx" ON "ShopInvitation"("shopId");
ALTER TABLE "ShopInvitation" ADD CONSTRAINT "ShopInvitation_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopInvitation" ADD CONSTRAINT "ShopInvitation_invitedBy_fkey"
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
