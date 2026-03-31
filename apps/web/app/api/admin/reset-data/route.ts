import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import * as fs from "fs";
import * as path from "path";

async function safeDelete(fn: () => Promise<{ count: number }>): Promise<number> {
  try {
    const result = await fn();
    return result.count;
  } catch {
    return 0;
  }
}

export async function POST() {
  try {
    const summary: Record<string, number> = {};

    // ── Dev store: delete all JSON files ──
    if (IS_DEV) {
      const devDir = path.join(process.cwd(), "lib", "dev");
      if (fs.existsSync(devDir)) {
        const jsonFiles = fs.readdirSync(devDir).filter((f) => f.endsWith(".json"));
        for (const file of jsonFiles) {
          fs.unlinkSync(path.join(devDir, file));
        }
        summary.devJsonFilesDeleted = jsonFiles.length;
      }
    }

    // ══════════════════════════════════════════════════
    // Prisma: delete ALL data in FK-safe order
    // Deepest children → parents → profiles → users
    // ══════════════════════════════════════════════════

    // ── Batch 1: Deepest leaves (analytics, logs, events, tracking) ──
    summary.popupImpressions = await safeDelete(() => prisma.popupImpression.deleteMany({}));
    summary.funnelEvents = await safeDelete(() => prisma.funnelEvent.deleteMany({}));
    summary.campaignEvents = await safeDelete(() => prisma.campaignEvent.deleteMany({}));
    summary.marketingEvents = await safeDelete(() => prisma.marketingEvent.deleteMany({}));
    summary.affiliateClicks = await safeDelete(() => prisma.affiliateClick.deleteMany({}));
    summary.affiliateCommissions = await safeDelete(() => prisma.affiliateCommission.deleteMany({}));
    summary.discountUsages = await safeDelete(() => prisma.discountUsage.deleteMany({}));
    summary.automationLogs = await safeDelete(() => prisma.automationLog.deleteMany({}));
    summary.auditLogs = await safeDelete(() => prisma.auditLog.deleteMany({}));
    summary.loginAttempts = await safeDelete(() => prisma.loginAttempt.deleteMany({}));
    summary.adminNotificationLogs = await safeDelete(() => prisma.adminNotificationLog.deleteMany({}));
    summary.boostDailyStats = await safeDelete(() => prisma.boostDailyStat.deleteMany({}));
    summary.serviceViews = await safeDelete(() => prisma.serviceView.deleteMany({}));
    summary.serviceClicks = await safeDelete(() => prisma.serviceClick.deleteMany({}));
    summary.lessonProgress = await safeDelete(() => prisma.lessonProgress.deleteMany({}));
    summary.lessonNotes = await safeDelete(() => prisma.lessonNote.deleteMany({}));
    summary.certificates = await safeDelete(() => prisma.certificate.deleteMany({}));
    summary.lessonResources = await safeDelete(() => prisma.lessonResource.deleteMany({}));
    summary.questions = await safeDelete(() => prisma.question.deleteMany({}));
    summary.courseDiscussionReplies = await safeDelete(() => prisma.courseDiscussionReply.deleteMany({}));
    summary.discussionReports = await safeDelete(() => prisma.discussionReport.deleteMany({}));
    summary.cohortMessages = await safeDelete(() => prisma.cohortMessage.deleteMany({}));
    summary.digitalProductReviews = await safeDelete(() => prisma.digitalProductReview.deleteMany({}));
    summary.digitalProductPurchases = await safeDelete(() => prisma.digitalProductPurchase.deleteMany({}));
    summary.contractSignatures = await safeDelete(() => prisma.contractSignature.deleteMany({}));
    summary.revisionRequests = await safeDelete(() => prisma.revisionRequest.deleteMany({}));
    summary.formationReviews = await safeDelete(() => prisma.formationReview.deleteMany({}));
    summary.cartItems = await safeDelete(() => prisma.cartItem.deleteMany({}));
    summary.abandonedCarts = await safeDelete(() => prisma.abandonedCart.deleteMany({}));
    summary.otpCodes = await safeDelete(() => prisma.otpCode.deleteMany({}));

    // ── Batch 2: Mid-level (orders children, messaging, learning mid) ──
    summary.reviews = await safeDelete(() => prisma.review.deleteMany({}));
    summary.escrows = await safeDelete(() => prisma.escrow.deleteMany({}));
    summary.payments = await safeDelete(() => prisma.payment.deleteMany({}));
    summary.disputes = await safeDelete(() => prisma.dispute.deleteMany({}));
    summary.refundRequests = await safeDelete(() => prisma.refundRequest.deleteMany({}));
    summary.adminTransactions = await safeDelete(() => prisma.adminTransaction.deleteMany({}));
    summary.adminPayouts = await safeDelete(() => prisma.adminPayout.deleteMany({}));
    summary.walletTransactions = await safeDelete(() => prisma.walletTransaction.deleteMany({}));
    summary.propositions = await safeDelete(() => prisma.proposition.deleteMany({}));
    summary.offers = await safeDelete(() => prisma.offer.deleteMany({}));
    summary.bids = await safeDelete(() => prisma.bid.deleteMany({}));
    summary.projectBids = await safeDelete(() => prisma.projectBid.deleteMany({}));
    summary.notifications = await safeDelete(() => prisma.notification.deleteMany({}));
    summary.messages = await safeDelete(() => prisma.message.deleteMany({}));
    summary.conversationUsers = await safeDelete(() => prisma.conversationUser.deleteMany({}));
    summary.quizzes = await safeDelete(() => prisma.quiz.deleteMany({}));
    summary.lessons = await safeDelete(() => prisma.lesson.deleteMany({}));
    summary.sections = await safeDelete(() => prisma.section.deleteMany({}));
    summary.salesPages = await safeDelete(() => prisma.salesPage.deleteMany({}));
    summary.enrollments = await safeDelete(() => prisma.enrollment.deleteMany({}));
    summary.courseDiscussions = await safeDelete(() => prisma.courseDiscussion.deleteMany({}));
    summary.formationCohorts = await safeDelete(() => prisma.formationCohort.deleteMany({}));
    summary.emailSequenceEnrollments = await safeDelete(() => prisma.emailSequenceEnrollment.deleteMany({}));
    summary.emailSequenceSteps = await safeDelete(() => prisma.emailSequenceStep.deleteMany({}));
    summary.funnelSteps = await safeDelete(() => prisma.funnelStep.deleteMany({}));
    summary.instructorWithdrawals = await safeDelete(() => prisma.instructorWithdrawal.deleteMany({}));
    summary.boosts = await safeDelete(() => prisma.boost.deleteMany({}));
    summary.userTags = await safeDelete(() => prisma.userTag.deleteMany({}));

    // ── Batch 3: Parent entities ──
    summary.orders = await safeDelete(() => prisma.order.deleteMany({}));
    summary.serviceOptions = await safeDelete(() => prisma.serviceOption.deleteMany({}));
    summary.serviceMedia = await safeDelete(() => prisma.serviceMedia.deleteMany({}));
    summary.serviceTags = await safeDelete(() => prisma.serviceTag.deleteMany({}));
    summary.services = await safeDelete(() => prisma.service.deleteMany({}));
    summary.contracts = await safeDelete(() => prisma.contract.deleteMany({}));
    summary.conversations = await safeDelete(() => prisma.conversation.deleteMany({}));
    summary.formations = await safeDelete(() => prisma.formation.deleteMany({}));
    summary.digitalProducts = await safeDelete(() => prisma.digitalProduct.deleteMany({}));
    summary.projects = await safeDelete(() => prisma.project.deleteMany({}));
    summary.emailSequences = await safeDelete(() => prisma.emailSequence.deleteMany({}));
    summary.salesFunnels = await safeDelete(() => prisma.salesFunnel.deleteMany({}));
    summary.smartPopups = await safeDelete(() => prisma.smartPopup.deleteMany({}));
    summary.campaignTrackers = await safeDelete(() => prisma.campaignTracker.deleteMany({}));
    summary.flashPromotions = await safeDelete(() => prisma.flashPromotion.deleteMany({}));
    summary.marketingPixels = await safeDelete(() => prisma.marketingPixel.deleteMany({}));
    summary.marketingPopups = await safeDelete(() => prisma.marketingPopup.deleteMany({}));
    summary.automationWorkflows = await safeDelete(() => prisma.automationWorkflow.deleteMany({}));
    summary.automationScenarios = await safeDelete(() => prisma.automationScenario.deleteMany({}));
    summary.affiliateProfiles = await safeDelete(() => prisma.affiliateProfile.deleteMany({}));
    summary.affiliatePrograms = await safeDelete(() => prisma.affiliateProgram.deleteMany({}));
    summary.discountCodes = await safeDelete(() => prisma.discountCode.deleteMany({}));
    summary.promoCodes = await safeDelete(() => prisma.promoCode.deleteMany({}));
    summary.blogPosts = await safeDelete(() => prisma.blogPost.deleteMany({}));
    summary.affiliationCodes = await safeDelete(() => prisma.affiliationCode.deleteMany({}));

    // ── Batch 4: User profiles & auth ──
    summary.freelancerProfiles = await safeDelete(() => prisma.freelancerProfile.deleteMany({}));
    summary.clientProfiles = await safeDelete(() => prisma.clientProfile.deleteMany({}));
    summary.agencyProfiles = await safeDelete(() => prisma.agencyProfile.deleteMany({}));
    summary.instructeurProfiles = await safeDelete(() => prisma.instructeurProfile.deleteMany({}));
    summary.teamMembers = await safeDelete(() => prisma.teamMember.deleteMany({}));
    summary.walletFreelances = await safeDelete(() => prisma.walletFreelance.deleteMany({}));
    summary.walletAgencies = await safeDelete(() => prisma.walletAgency.deleteMany({}));
    summary.accounts = await safeDelete(() => prisma.account.deleteMany({}));
    summary.sessions = await safeDelete(() => prisma.session.deleteMany({}));
    summary.adminInvitations = await safeDelete(() => prisma.adminInvitation.deleteMany({}));
    summary.kycRequests = await safeDelete(() => prisma.kycRequest.deleteMany({}));

    // ── Batch 5: Delete all users except admins ──
    summary.users = await safeDelete(() =>
      prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } })
    );

    // ── Batch 6: Reset admin wallets to zero ──
    try {
      const wallets = await prisma.adminWallet.updateMany({
        data: { balance: 0, totalCommissions: 0, totalPayouts: 0 },
      });
      summary.adminWalletsReset = wallets.count;
    } catch {
      summary.adminWalletsReset = 0;
    }

    // Count non-zero deletions for a clean summary
    const totalDeleted = Object.values(summary).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      message: "Reset complet. Toutes les donnees supprimees sauf comptes admin.",
      totalDeleted,
      summary,
    });
  } catch (error) {
    console.error("[API /admin/reset-data POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du reset des donnees" },
      { status: 500 },
    );
  }
}
