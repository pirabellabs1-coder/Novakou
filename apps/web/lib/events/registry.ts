/**
 * Novakou — Event Registry
 * Map centrale : chaque evenement → { notification, email }
 *
 * notification() retourne un NotificationOutput | NotificationOutput[] | null
 * email() est une fonction async qui envoie via les templates dark mode
 */

import type {
  EventName, EventPayloadMap, NotificationOutput,
  OrderEventPayload, OfferEventPayload, MessageEventPayload,
  ReviewEventPayload, AgencyEventPayload, CourseEventPayload,
  ProductEventPayload, KycEventPayload, PaymentEventPayload,
  WithdrawalEventPayload, AdminEventPayload, SystemEventPayload,
  ServiceEventPayload,
} from "./types";

// ── Email template imports ──
import {
  sendOrderCreatedClientEmail, sendOrderCreatedFreelanceEmail,
  sendOrderDeliveredEmail, sendOrderCompletedEmail, sendOrderCancelledEmail,
  sendOrderRevisionEmail, sendOrderDeadline24hEmail, sendOrderOverdueEmail,
} from "@/lib/email/templates/order";

import {
  sendPaymentSuccessEmail, sendPaymentFailedEmail,
  sendWithdrawalRequestedEmail, sendWithdrawalApprovedEmail, sendWithdrawalRejectedEmail,
} from "@/lib/email/templates/payment";

import {
  sendKycSubmittedEmail, sendKycApprovedDarkEmail, sendKycRejectedDarkEmail,
} from "@/lib/email/templates/kyc";

import {
  sendMemberInvitedEmail, sendMemberRemovedEmail,
  sendAgencyServiceApprovedEmail, sendAgencyServiceRejectedEmail,
} from "@/lib/email/templates/agency";

import {
  sendCoursePurchasedEmail, sendCourseCompletedEmail,
  sendCertificateGeneratedEmail, sendNewLessonEmail, sendCourseReviewedEmail,
} from "@/lib/email/templates/formation";

import {
  sendProductPurchasedEmail, sendProductSoldEmail, sendProductDownloadedEmail,
} from "@/lib/email/templates/product";

import { sendReviewReceivedEmail } from "@/lib/email/templates/review";

import {
  sendOfferSentEmail, sendOfferAcceptedEmail, sendOfferRejectedEmail,
} from "@/lib/email/templates/offer";

import {
  sendWelcomeDarkEmail, sendVerificationDarkEmail, sendPasswordResetDarkEmail,
  sendAccountSuspendedDarkEmail, sendAccountBannedDarkEmail,
} from "@/lib/email/templates/system";

import {
  sendServiceApprovedDarkEmail, sendServiceRejectedDarkEmail,
} from "@/lib/email/templates/admin";

import { sendNewMessageEmail } from "@/lib/email";

// ── Registry entry type ──

type AnyPayload = EventPayloadMap[EventName];

interface RegistryEntry<P = AnyPayload> {
  notification?: (payload: P) => NotificationOutput | NotificationOutput[] | null;
  email?: (payload: P) => Promise<unknown>;
}

// ── EVENT REGISTRY ──

export const EVENT_REGISTRY: {
  [E in EventName]: RegistryEntry<EventPayloadMap[E]>;
} = {

  // ═══════════════════════════════════════════════════════════════════
  // COMMANDES
  // ═══════════════════════════════════════════════════════════════════

  "order.created": {
    notification: (p: OrderEventPayload) => [
      {
        userId: p.freelanceId,
        title: "Nouvelle commande",
        message: `${p.clientName} a commande "${p.serviceTitle}" pour ${p.amount.toFixed(2)} EUR`,
        type: "order",
        link: "/dashboard/commandes",
      },
      {
        userId: p.clientId,
        title: "Commande confirmee",
        message: `Votre commande pour "${p.serviceTitle}" a ete enregistree`,
        type: "order",
        link: "/client/commandes",
      },
    ],
    email: async (p: OrderEventPayload) => {
      await Promise.allSettled([
        sendOrderCreatedClientEmail(p.clientEmail, p.clientName, {
          orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
          clientName: p.clientName, freelanceName: p.freelanceName, deadline: p.deadline,
        }),
        sendOrderCreatedFreelanceEmail(p.freelanceEmail, p.freelanceName, {
          orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
          clientName: p.clientName, freelanceName: p.freelanceName, deadline: p.deadline,
        }),
      ]);
    },
  },

  "order.accepted": {
    notification: (p: OrderEventPayload) => ({
      userId: p.clientId,
      title: "Commande acceptee",
      message: `${p.freelanceName} a accepte votre commande pour "${p.serviceTitle}"`,
      type: "order",
      link: "/client/commandes",
    }),
    email: undefined,
  },

  "order.in_progress": {
    notification: (p: OrderEventPayload) => ({
      userId: p.clientId,
      title: "Commande en cours",
      message: `${p.freelanceName} a commence a travailler sur "${p.serviceTitle}"`,
      type: "order",
      link: "/client/commandes",
    }),
    email: undefined,
  },

  "order.delivered": {
    notification: (p: OrderEventPayload) => ({
      userId: p.clientId,
      title: "Livraison effectuee",
      message: `${p.freelanceName} a livre "${p.serviceTitle}". Verifiez et validez la livraison.`,
      type: "order",
      link: "/client/commandes",
    }),
    email: async (p: OrderEventPayload) => {
      await sendOrderDeliveredEmail(p.clientEmail, p.clientName, {
        orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
        clientName: p.clientName, freelanceName: p.freelanceName,
      });
    },
  },

  "order.completed": {
    notification: (p: OrderEventPayload) => [
      {
        userId: p.freelanceId,
        title: "Commande terminee",
        message: `La commande "${p.serviceTitle}" est terminee. ${p.amount.toFixed(2)} EUR credits.`,
        type: "payment",
        link: "/dashboard/finances",
      },
      {
        userId: p.clientId,
        title: "Commande terminee",
        message: `La commande "${p.serviceTitle}" est terminee avec succes.`,
        type: "order",
        link: "/client/commandes",
      },
    ],
    email: async (p: OrderEventPayload) => {
      await sendOrderCompletedEmail(p.freelanceEmail, p.freelanceName, {
        orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
        clientName: p.clientName, freelanceName: p.freelanceName,
      });
    },
  },

  "order.cancelled": {
    notification: (p: OrderEventPayload) => [
      {
        userId: p.freelanceId,
        title: "Commande annulee",
        message: `La commande "${p.serviceTitle}" a ete annulee`,
        type: "order",
        link: "/dashboard/commandes",
      },
      {
        userId: p.clientId,
        title: "Commande annulee",
        message: `Votre commande "${p.serviceTitle}" a ete annulee`,
        type: "order",
        link: "/client/commandes",
      },
    ],
    email: async (p: OrderEventPayload) => {
      await Promise.allSettled([
        sendOrderCancelledEmail(p.freelanceEmail, p.freelanceName, {
          orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
          clientName: p.clientName, freelanceName: p.freelanceName,
        }),
        sendOrderCancelledEmail(p.clientEmail, p.clientName, {
          orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
          clientName: p.clientName, freelanceName: p.freelanceName,
        }),
      ]);
    },
  },

  "order.revision_requested": {
    notification: (p: OrderEventPayload) => ({
      userId: p.freelanceId,
      title: "Revision demandee",
      message: `${p.clientName} demande une revision pour "${p.serviceTitle}"`,
      type: "order",
      link: "/dashboard/commandes",
    }),
    email: async (p: OrderEventPayload) => {
      await sendOrderRevisionEmail(p.freelanceEmail, p.freelanceName, {
        orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
        clientName: p.clientName, freelanceName: p.freelanceName,
      }, p.revisionMessage);
    },
  },

  "order.deadline_24h": {
    notification: (p: OrderEventPayload) => ({
      userId: p.freelanceId,
      title: "Delai dans 24h",
      message: `La commande "${p.serviceTitle}" doit etre livree dans les 24 prochaines heures`,
      type: "order",
      link: "/dashboard/commandes",
    }),
    email: async (p: OrderEventPayload) => {
      await sendOrderDeadline24hEmail(p.freelanceEmail, p.freelanceName, {
        orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
        clientName: p.clientName, freelanceName: p.freelanceName, deadline: p.deadline,
      });
    },
  },

  "order.deadline_overdue": {
    notification: (p: OrderEventPayload) => [
      {
        userId: p.freelanceId,
        title: "Commande en retard",
        message: `La commande "${p.serviceTitle}" a depasse la date limite`,
        type: "order",
        link: "/dashboard/commandes",
      },
      {
        userId: p.clientId,
        title: "Commande en retard",
        message: `La commande "${p.serviceTitle}" n'a pas ete livree a temps`,
        type: "order",
        link: "/client/commandes",
      },
    ],
    email: async (p: OrderEventPayload) => {
      await sendOrderOverdueEmail(p.freelanceEmail, p.freelanceName, {
        orderId: p.orderId, serviceTitle: p.serviceTitle, amount: p.amount,
        clientName: p.clientName, freelanceName: p.freelanceName,
      });
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // OFFRES
  // ═══════════════════════════════════════════════════════════════════

  "offer.sent": {
    notification: (p: OfferEventPayload) => ({
      userId: p.clientId,
      title: "Nouvelle offre recue",
      message: `${p.freelanceName} vous a envoye une offre : "${p.title}" (${p.amount.toFixed(2)} EUR)`,
      type: "offer",
      link: "/client/offres",
    }),
    email: async (p: OfferEventPayload) => {
      await sendOfferSentEmail(p.clientEmail, p.clientName, {
        freelanceName: p.freelanceName, title: p.title, amount: p.amount, delay: p.delay,
      });
    },
  },

  "offer.accepted": {
    notification: (p: OfferEventPayload) => ({
      userId: p.freelanceId,
      title: "Offre acceptee",
      message: `${p.clientName} a accepte votre offre "${p.title}"`,
      type: "offer",
      link: "/dashboard/offres",
    }),
    email: async (p: OfferEventPayload) => {
      await sendOfferAcceptedEmail(p.freelanceEmail, p.freelanceName, {
        clientName: p.clientName, title: p.title, amount: p.amount,
      });
    },
  },

  "offer.rejected": {
    notification: (p: OfferEventPayload) => ({
      userId: p.freelanceId,
      title: "Offre refusee",
      message: `${p.clientName} a decline votre offre "${p.title}"`,
      type: "offer",
      link: "/dashboard/offres",
    }),
    email: async (p: OfferEventPayload) => {
      await sendOfferRejectedEmail(p.freelanceEmail, p.freelanceName, {
        clientName: p.clientName, title: p.title,
      });
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  "message.received": {
    notification: (p: MessageEventPayload) => ({
      userId: p.recipientId,
      title: `Message de ${p.senderName}`,
      message: p.messagePreview.slice(0, 100),
      type: "message",
      link: `/messages/${p.conversationId}`,
    }),
    email: async (p: MessageEventPayload) => {
      const { getAppUrl } = await import("@/lib/email");
      await sendNewMessageEmail(
        p.recipientEmail, p.recipientName, p.senderName,
        p.messagePreview, `${getAppUrl()}/messages/${p.conversationId}`
      );
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // AVIS
  // ═══════════════════════════════════════════════════════════════════

  "review.received": {
    notification: (p: ReviewEventPayload) => ({
      userId: p.freelanceId,
      title: "Nouvel avis",
      message: `${p.reviewerName} a laisse un avis ${p.rating}/5 sur "${p.serviceTitle}"`,
      type: "review",
      link: "/dashboard/avis",
    }),
    email: async (p: ReviewEventPayload) => {
      await sendReviewReceivedEmail(p.freelanceEmail, p.freelanceName, {
        serviceTitle: p.serviceTitle, reviewerName: p.reviewerName,
        rating: p.rating, comment: p.comment,
      });
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // AGENCE
  // ═══════════════════════════════════════════════════════════════════

  "agency.member_invited": {
    notification: (p: AgencyEventPayload) => (p.memberId ? {
      userId: p.memberId,
      title: "Invitation agence",
      message: `${p.inviterName || p.agencyName} vous invite a rejoindre l'agence ${p.agencyName}`,
      type: "agency",
      link: "/agence/equipe",
    } : null),
    email: async (p: AgencyEventPayload) => {
      if (p.memberEmail && p.memberName) {
        await sendMemberInvitedEmail(p.memberEmail, p.memberName, {
          agencyName: p.agencyName, inviterName: p.inviterName || p.agencyName,
        });
      }
    },
  },

  "agency.member_joined": {
    notification: (p: AgencyEventPayload) => null,
    email: undefined,
  },

  "agency.member_removed": {
    notification: (p: AgencyEventPayload) => (p.memberId ? {
      userId: p.memberId,
      title: "Retrait de l'agence",
      message: `Vous avez ete retire de l'agence ${p.agencyName}`,
      type: "agency",
      link: "/dashboard",
    } : null),
    email: async (p: AgencyEventPayload) => {
      if (p.memberEmail && p.memberName) {
        await sendMemberRemovedEmail(p.memberEmail, p.memberName, {
          agencyName: p.agencyName,
        });
      }
    },
  },

  "agency.service_created": {
    notification: (p: AgencyEventPayload) => null,
    email: undefined,
  },

  "agency.service_approved": {
    notification: (p: AgencyEventPayload) => (p.memberId ? {
      userId: p.memberId,
      title: "Service agence publie",
      message: `Le service "${p.serviceTitle}" de ${p.agencyName} est maintenant publie`,
      type: "service",
      link: "/agence/services",
    } : null),
    email: async (p: AgencyEventPayload) => {
      if (p.memberEmail && p.memberName && p.serviceTitle) {
        await sendAgencyServiceApprovedEmail(p.memberEmail, p.memberName, {
          serviceTitle: p.serviceTitle, agencyName: p.agencyName,
        });
      }
    },
  },

  "agency.service_rejected": {
    notification: (p: AgencyEventPayload) => (p.memberId ? {
      userId: p.memberId,
      title: "Service agence refuse",
      message: `Le service "${p.serviceTitle}" de ${p.agencyName} n'a pas ete approuve`,
      type: "service",
      link: "/agence/services",
    } : null),
    email: async (p: AgencyEventPayload) => {
      if (p.memberEmail && p.memberName && p.serviceTitle) {
        await sendAgencyServiceRejectedEmail(p.memberEmail, p.memberName, {
          serviceTitle: p.serviceTitle, reason: p.reason,
        });
      }
    },
  },

  "agency.order_received": {
    notification: (p: AgencyEventPayload) => (p.memberId ? {
      userId: p.memberId,
      title: "Nouvelle commande agence",
      message: `Nouvelle commande pour "${p.serviceTitle}" (${p.amount?.toFixed(2)} EUR)`,
      type: "order",
      link: "/agence/commandes",
    } : null),
    email: undefined,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FORMATIONS
  // ═══════════════════════════════════════════════════════════════════

  "course.purchased": {
    notification: (p: CourseEventPayload) => {
      const notifs: NotificationOutput[] = [];
      if (p.studentId) {
        notifs.push({
          userId: p.studentId,
          title: "Formation achetee",
          message: `Vous avez achete la formation "${p.courseTitle}"`,
          type: "course",
          link: "/",
        });
      }
      if (p.instructorId) {
        notifs.push({
          userId: p.instructorId,
          title: "Nouvelle inscription",
          message: `${p.studentName || "Un etudiant"} s'est inscrit a "${p.courseTitle}"`,
          type: "course",
          link: "/vendeur/produits",
        });
      }
      return notifs.length > 0 ? notifs : null;
    },
    email: async (p: CourseEventPayload) => {
      if (p.studentEmail && p.studentName) {
        await sendCoursePurchasedEmail(p.studentEmail, p.studentName, {
          courseTitle: p.courseTitle, instructorName: p.instructorName,
        });
      }
    },
  },

  "course.enrolled": {
    notification: (p: CourseEventPayload) => (p.studentId ? {
      userId: p.studentId,
      title: "Inscription confirmee",
      message: `Vous etes inscrit a la formation "${p.courseTitle}"`,
      type: "course",
      link: "/",
    } : null),
    email: undefined,
  },

  "course.completed": {
    notification: (p: CourseEventPayload) => (p.studentId ? {
      userId: p.studentId,
      title: "Formation terminee !",
      message: `Felicitations ! Vous avez termine "${p.courseTitle}"`,
      type: "course",
      link: "/dashboard/certifications",
    } : null),
    email: async (p: CourseEventPayload) => {
      if (p.studentEmail && p.studentName) {
        await sendCourseCompletedEmail(p.studentEmail, p.studentName, {
          courseTitle: p.courseTitle,
        });
      }
    },
  },

  "certificate.generated": {
    notification: (p: CourseEventPayload) => (p.studentId ? {
      userId: p.studentId,
      title: "Certificat genere",
      message: `Votre certificat pour "${p.courseTitle}" est pret`,
      type: "course",
      link: "/dashboard/certifications",
    } : null),
    email: async (p: CourseEventPayload) => {
      if (p.studentEmail && p.studentName) {
        await sendCertificateGeneratedEmail(p.studentEmail, p.studentName, {
          courseTitle: p.courseTitle, certificateUrl: p.certificateUrl,
        });
      }
    },
  },

  "course.new_lesson": {
    notification: (p: CourseEventPayload) => (p.studentId ? {
      userId: p.studentId,
      title: "Nouvelle lecon",
      message: `${p.lessonTitle || "Une nouvelle lecon"} a ete ajoutee a "${p.courseTitle}"`,
      type: "course",
      link: "/",
    } : null),
    email: async (p: CourseEventPayload) => {
      if (p.studentEmail && p.studentName) {
        await sendNewLessonEmail(p.studentEmail, p.studentName, {
          courseTitle: p.courseTitle, lessonTitle: p.lessonTitle,
        });
      }
    },
  },

  "course.reviewed": {
    notification: (p: CourseEventPayload) => (p.instructorId ? {
      userId: p.instructorId,
      title: "Nouvel avis formation",
      message: `${p.studentName || "Un etudiant"} a note "${p.courseTitle}" ${p.rating || 0}/5`,
      type: "review",
      link: "/vendeur/produits",
    } : null),
    email: async (p: CourseEventPayload) => {
      if (p.instructorEmail && p.instructorName) {
        await sendCourseReviewedEmail(p.instructorEmail, p.instructorName, {
          courseTitle: p.courseTitle, rating: p.rating || 0,
          comment: p.comment, reviewerName: p.studentName,
        });
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PRODUITS
  // ═══════════════════════════════════════════════════════════════════

  "product.purchased": {
    notification: (p: ProductEventPayload) => [
      {
        userId: p.buyerId,
        title: "Achat confirme",
        message: `Vous avez achete "${p.productTitle}"`,
        type: "product",
        link: "/client/achats",
      },
      {
        userId: p.sellerId,
        title: "Nouvelle vente",
        message: `${p.buyerName} a achete "${p.productTitle}" (${p.amount.toFixed(2)} EUR)`,
        type: "payment",
        link: "/dashboard/finances",
      },
    ],
    email: async (p: ProductEventPayload) => {
      await Promise.allSettled([
        sendProductPurchasedEmail(p.buyerEmail, p.buyerName, {
          productTitle: p.productTitle, amount: p.amount, downloadUrl: p.downloadUrl,
        }),
        sendProductSoldEmail(p.sellerEmail, p.sellerName, {
          productTitle: p.productTitle, amount: p.amount, buyerName: p.buyerName,
        }),
      ]);
    },
  },

  "product.downloaded": {
    notification: (p: ProductEventPayload) => ({
      userId: p.sellerId,
      title: "Produit telecharge",
      message: `${p.buyerName} a telecharge "${p.productTitle}"`,
      type: "product",
      link: "/dashboard/produits",
    }),
    email: async (p: ProductEventPayload) => {
      await sendProductDownloadedEmail(p.sellerEmail, p.sellerName, {
        productTitle: p.productTitle, buyerName: p.buyerName,
      });
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // KYC
  // ═══════════════════════════════════════════════════════════════════

  "kyc.submitted": {
    notification: (p: KycEventPayload) => ({
      userId: p.userId,
      title: "Demande KYC soumise",
      message: `Votre demande de verification niveau ${p.level} a ete soumise`,
      type: "kyc",
      link: "/dashboard/kyc",
    }),
    email: async (p: KycEventPayload) => {
      await sendKycSubmittedEmail(p.userEmail, p.userName, p.level);
    },
  },

  "kyc.approved": {
    notification: (p: KycEventPayload) => ({
      userId: p.userId,
      title: "KYC approuve !",
      message: `Votre verification de niveau ${p.level} a ete approuvee`,
      type: "kyc",
      link: "/dashboard/profil",
    }),
    email: async (p: KycEventPayload) => {
      await sendKycApprovedDarkEmail(p.userEmail, p.userName, p.level);
    },
  },

  "kyc.rejected": {
    notification: (p: KycEventPayload) => ({
      userId: p.userId,
      title: "KYC refuse",
      message: `Votre verification de niveau ${p.level} a ete refusee${p.reason ? ` : ${p.reason}` : ""}`,
      type: "kyc",
      link: "/dashboard/kyc",
    }),
    email: async (p: KycEventPayload) => {
      await sendKycRejectedDarkEmail(p.userEmail, p.userName, p.level, p.reason || "Non conforme");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // PAIEMENTS
  // ═══════════════════════════════════════════════════════════════════

  "payment.success": {
    notification: (p: PaymentEventPayload) => ({
      userId: p.userId,
      title: "Paiement recu",
      message: `+${p.amount.toFixed(2)} EUR credits sur votre portefeuille`,
      type: "payment",
      link: "/dashboard/finances",
    }),
    email: async (p: PaymentEventPayload) => {
      await sendPaymentSuccessEmail(p.userEmail, p.userName, {
        amount: p.amount, serviceTitle: p.serviceTitle || "Service Novakou",
      });
    },
  },

  "payment.failed": {
    notification: (p: PaymentEventPayload) => ({
      userId: p.userId,
      title: "Echec du paiement",
      message: `Le paiement de ${p.amount.toFixed(2)} EUR a echoue`,
      type: "payment",
      link: "/client/commandes",
    }),
    email: async (p: PaymentEventPayload) => {
      await sendPaymentFailedEmail(p.userEmail, p.userName, {
        amount: p.amount, serviceTitle: p.serviceTitle || "Service Novakou",
        reason: p.reason,
      });
    },
  },

  "withdrawal.requested": {
    notification: (p: WithdrawalEventPayload) => ({
      userId: p.userId,
      title: "Retrait demande",
      message: `Demande de retrait de ${p.amount.toFixed(2)} EUR via ${p.method}`,
      type: "payment",
      link: "/dashboard/finances",
    }),
    email: async (p: WithdrawalEventPayload) => {
      await sendWithdrawalRequestedEmail(p.userEmail, p.userName, {
        amount: p.amount, method: p.method,
      });
    },
  },

  "withdrawal.approved": {
    notification: (p: WithdrawalEventPayload) => ({
      userId: p.userId,
      title: "Retrait approuve",
      message: `Votre retrait de ${p.amount.toFixed(2)} EUR a ete approuve`,
      type: "payment",
      link: "/dashboard/finances",
    }),
    email: async (p: WithdrawalEventPayload) => {
      await sendWithdrawalApprovedEmail(p.userEmail, p.userName, {
        amount: p.amount, method: p.method,
      });
    },
  },

  "withdrawal.rejected": {
    notification: (p: WithdrawalEventPayload) => ({
      userId: p.userId,
      title: "Retrait refuse",
      message: `Votre demande de retrait de ${p.amount.toFixed(2)} EUR a ete refusee`,
      type: "payment",
      link: "/dashboard/finances",
    }),
    email: async (p: WithdrawalEventPayload) => {
      await sendWithdrawalRejectedEmail(p.userEmail, p.userName, {
        amount: p.amount, reason: p.reason,
      });
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SERVICES (moderation admin)
  // ═══════════════════════════════════════════════════════════════════

  "service.approved": {
    notification: (p: ServiceEventPayload) => ({
      userId: p.userId,
      title: "Service publie !",
      message: `Votre service "${p.serviceTitle}" est maintenant visible sur la marketplace`,
      type: "service",
      link: "/dashboard/services",
    }),
    email: async (p: ServiceEventPayload) => {
      await sendServiceApprovedDarkEmail(p.userEmail, p.userName, p.serviceTitle);
    },
  },

  "service.rejected": {
    notification: (p: ServiceEventPayload) => ({
      userId: p.userId,
      title: "Service non approuve",
      message: `Votre service "${p.serviceTitle}" n'a pas pu etre publie${p.reason ? ` : ${p.reason}` : ""}`,
      type: "service",
      link: "/dashboard/services",
    }),
    email: async (p: ServiceEventPayload) => {
      await sendServiceRejectedDarkEmail(p.userEmail, p.userName, p.serviceTitle, p.reason || "Non conforme");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN (alertes internes)
  // ═══════════════════════════════════════════════════════════════════

  "admin.new_user": {
    notification: (p: AdminEventPayload) => (p.adminId ? {
      userId: p.adminId,
      title: "Nouvel utilisateur",
      message: `${p.userName || "Quelqu'un"} (${p.userRole || "inconnu"}) vient de s'inscrire`,
      type: "system",
      link: "/admin/utilisateurs",
    } : null),
    email: undefined,
  },

  "admin.new_service": {
    notification: (p: AdminEventPayload) => (p.adminId ? {
      userId: p.adminId,
      title: "Nouveau service publie",
      message: `"${p.serviceTitle || "Service"}" par ${p.userName || "un freelance"}`,
      type: "service",
      link: "/admin/services",
    } : null),
    email: undefined,
  },

  "admin.new_course": {
    notification: (p: AdminEventPayload) => (p.adminId ? {
      userId: p.adminId,
      title: "Nouvelle formation",
      message: `"${p.courseTitle || "Formation"}" par ${p.userName || "un instructeur"}`,
      type: "system",
      link: "/admin",
    } : null),
    email: undefined,
  },

  "admin.dispute_opened": {
    notification: (p: AdminEventPayload) => (p.adminId ? {
      userId: p.adminId,
      title: "Nouveau litige",
      message: `Litige ouvert${p.userName ? ` par ${p.userName}` : ""}`,
      type: "system",
      link: "/admin/litiges",
    } : null),
    email: undefined,
  },

  "admin.dispute_resolved": {
    notification: (p: AdminEventPayload) => (p.userId ? {
      userId: p.userId,
      title: "Litige resolu",
      message: `Le litige pour la commande a ete resolu${p.verdict ? ` : verdict en faveur du ${p.verdict}` : ""}`,
      type: "system",
      link: "/dashboard/commandes",
    } : null),
    email: undefined,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SYSTEME
  // ═══════════════════════════════════════════════════════════════════

  "system.welcome": {
    notification: (p: SystemEventPayload) => ({
      userId: p.userId,
      title: "Bienvenue sur Novakou !",
      message: "Votre compte a ete cree avec succes. Completez votre profil pour commencer.",
      type: "system",
      link: "/dashboard/profil",
    }),
    email: async (p: SystemEventPayload) => {
      await sendWelcomeDarkEmail(p.userEmail, p.userName, p.dashboardUrl);
    },
  },

  "system.email_verification": {
    notification: undefined,
    email: async (p: SystemEventPayload) => {
      if (p.code) {
        await sendVerificationDarkEmail(p.userEmail, p.userName, p.code);
      }
    },
  },

  "system.password_reset": {
    notification: undefined,
    email: async (p: SystemEventPayload) => {
      if (p.resetToken) {
        await sendPasswordResetDarkEmail(p.userEmail, p.userName, p.resetToken);
      }
    },
  },

  "system.account_suspended": {
    notification: (p: SystemEventPayload) => ({
      userId: p.userId,
      title: "Compte suspendu",
      message: "Votre compte a ete temporairement suspendu.",
      type: "system",
    }),
    email: async (p: SystemEventPayload) => {
      await sendAccountSuspendedDarkEmail(p.userEmail, p.userName, p.reason);
    },
  },

  "system.account_banned": {
    notification: (p: SystemEventPayload) => ({
      userId: p.userId,
      title: "Compte banni",
      message: "Votre compte a ete definitivement banni.",
      type: "system",
    }),
    email: async (p: SystemEventPayload) => {
      await sendAccountBannedDarkEmail(p.userEmail, p.userName, p.reason);
    },
  },
};
