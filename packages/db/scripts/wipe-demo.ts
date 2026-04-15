/**
 * Wipe ALL demo/test data from the database.
 *
 * Supprime :
 *   - Toutes les formations + enrollments + reviews + certificates
 *   - Tous les produits numériques + purchases + reviews
 *   - Tous les mentor profiles + bookings
 *   - Tous les funnels + steps + events
 *   - Tous les workflows + email sequences + campaigns + popups + codes promo + pixels
 *   - Tous les carts + cart items
 *   - Toutes les transactions (platformRevenue + affiliate commissions)
 *
 * Ne supprime PAS :
 *   - Les users (comptes utilisateur, dont l'admin)
 *   - Les categories (framework de la plateforme)
 *   - L'instructeurProfile (garde la coquille vide pour re-créer après)
 *
 * Usage: pnpm --filter=db tsx scripts/wipe-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  NETTOYAGE DES DONNÉES DÉMO FREELANCEHIGH");
  console.log("══════════════════════════════════════════════════════════════\n");

  // Order matters — delete children before parents (FK constraints)
  const ops: Array<[string, () => Promise<{ count: number }>]> = [
    // Funnel events/steps (children of funnels)
    ["FunnelEvent", () => prisma.funnelEvent.deleteMany({})],
    ["FunnelStep", () => prisma.funnelStep.deleteMany({})],
    ["SalesFunnel", () => prisma.salesFunnel.deleteMany({})],

    // Marketing children
    ["PopupImpression", () => prisma.popupImpression.deleteMany({})],
    ["SmartPopup", () => prisma.smartPopup.deleteMany({})],
    ["CampaignEvent", () => prisma.campaignEvent.deleteMany({})],
    ["CampaignTracker", () => prisma.campaignTracker.deleteMany({})],
    ["MarketingEvent", () => prisma.marketingEvent.deleteMany({})],
    ["MarketingPixel", () => prisma.marketingPixel.deleteMany({})],

    // Workflows + email sequences
    ["AutomationWorkflowLog", () => prisma.automationWorkflowLog.deleteMany({})],
    ["AutomationWorkflow", () => prisma.automationWorkflow.deleteMany({})],
    ["EmailSequenceEnrollment", () => prisma.emailSequenceEnrollment.deleteMany({})],
    ["EmailSequenceStep", () => prisma.emailSequenceStep.deleteMany({})],
    ["EmailSequence", () => prisma.emailSequence.deleteMany({})],

    // Affiliate
    ["AffiliateCommission", () => prisma.affiliateCommission.deleteMany({})],
    ["AffiliateClick", () => prisma.affiliateClick.deleteMany({})],
    ["AffiliateProfile", () => prisma.affiliateProfile.deleteMany({})],
    ["AffiliateProgram", () => prisma.affiliateProgram.deleteMany({})],

    // Discounts
    ["DiscountUsage", () => prisma.discountUsage.deleteMany({})],
    ["DiscountCode", () => prisma.discountCode.deleteMany({})],
    ["FlashPromotion", () => prisma.flashPromotion.deleteMany({})],

    // Abandoned carts + cart items
    ["AbandonedCart", () => prisma.abandonedCart.deleteMany({})],
    ["CartItem", () => prisma.cartItem.deleteMany({})],

    // Platform revenue ledger
    ["PlatformRevenue", () => prisma.platformRevenue.deleteMany({})],

    // Reviews + certificates + notes + progress
    ["LessonNote", () => prisma.lessonNote.deleteMany({})],
    ["LessonProgress", () => prisma.lessonProgress.deleteMany({})],
    ["Certificate", () => prisma.certificate.deleteMany({})],
    ["FormationReview", () => prisma.formationReview.deleteMany({})],
    ["DigitalProductReview", () => prisma.digitalProductReview.deleteMany({})],

    // Purchases + enrollments (consumption)
    ["DigitalProductPurchase", () => prisma.digitalProductPurchase.deleteMany({})],
    ["Enrollment", () => prisma.enrollment.deleteMany({})],

    // Course discussions (children of Formations)
    ["DiscussionReport", () => prisma.discussionReport.deleteMany({})],
    ["CourseDiscussionReply", () => prisma.courseDiscussionReply.deleteMany({})],
    ["CourseDiscussion", () => prisma.courseDiscussion.deleteMany({})],

    // Lessons / Sections / Quiz
    ["LessonResource", () => prisma.lessonResource.deleteMany({})],
    ["Question", () => prisma.question.deleteMany({})],
    ["Quiz", () => prisma.quiz.deleteMany({})],
    ["Lesson", () => prisma.lesson.deleteMany({})],
    ["Section", () => prisma.section.deleteMany({})],

    // Cohorts
    ["CohortMessage", () => prisma.cohortMessage.deleteMany({})],
    ["FormationCohort", () => prisma.formationCohort.deleteMany({})],

    // Sales pages
    ["SalesPage", () => prisma.salesPage.deleteMany({})],

    // Main content
    ["Formation", () => prisma.formation.deleteMany({})],
    ["DigitalProduct", () => prisma.digitalProduct.deleteMany({})],

    // Mentor bookings + profiles
    ["MentorBooking", () => prisma.mentorBooking.deleteMany({})],
    ["MentorProfile", () => prisma.mentorProfile.deleteMany({})],

    // Withdrawals
    ["InstructorWithdrawal", () => prisma.instructorWithdrawal.deleteMany({})],

    // User tags
    ["UserTag", () => prisma.userTag.deleteMany({})],

    // Refund requests
    ["RefundRequest", () => prisma.refundRequest.deleteMany({})],
  ];

  let totalDeleted = 0;
  for (const [name, fn] of ops) {
    try {
      const res = await fn();
      if (res.count > 0) {
        console.log(`  ✓ ${name.padEnd(30)} : ${res.count} supprimé(s)`);
        totalDeleted += res.count;
      }
    } catch (err) {
      console.warn(`  ⚠ ${name.padEnd(30)} : ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`);
    }
  }

  console.log("\n──────────────────────────────────────────────────────────────");
  console.log(`  Total supprimé : ${totalDeleted} enregistrement(s)`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("\n  ✓ Base nettoyée. Users + Categories conservés.\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ Erreur lors du wipe :", err);
  process.exit(1);
});
