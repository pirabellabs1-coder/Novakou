/**
 * Novakou — Event System Types
 * Typage fort pour emitEvent() — chaque evenement a un payload specifique.
 */

// ── Payloads par domaine ──

export interface OrderEventPayload {
  orderId: string;
  serviceTitle: string;
  amount: number;
  freelanceId: string;
  freelanceName: string;
  freelanceEmail: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  deadline?: string;
  packageType?: string;
  revisionMessage?: string;
}

export interface OfferEventPayload {
  offerId: string;
  freelanceId: string;
  freelanceName: string;
  freelanceEmail: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  title: string;
  amount: number;
  delay: string;
}

export interface MessageEventPayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  messagePreview: string;
}

export interface ReviewEventPayload {
  reviewId: string;
  orderId: string;
  serviceTitle: string;
  reviewerName: string;
  rating: number;
  comment: string;
  freelanceId: string;
  freelanceName: string;
  freelanceEmail: string;
}

export interface AgencyEventPayload {
  agencyId: string;
  agencyName: string;
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  inviterName?: string;
  serviceId?: string;
  serviceTitle?: string;
  orderId?: string;
  amount?: number;
  reason?: string;
}

export interface CourseEventPayload {
  courseId: string;
  courseTitle: string;
  instructorId?: string;
  instructorName?: string;
  instructorEmail?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  lessonTitle?: string;
  certificateUrl?: string;
  rating?: number;
  comment?: string;
}

export interface ProductEventPayload {
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  downloadUrl?: string;
}

export interface KycEventPayload {
  userId: string;
  userName: string;
  userEmail: string;
  level: number;
  reason?: string;
}

export interface PaymentEventPayload {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method?: string;
  orderId?: string;
  serviceTitle?: string;
  transactionId?: string;
  reason?: string;
}

export interface WithdrawalEventPayload {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: string;
  reason?: string;
}

export interface AdminEventPayload {
  adminId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  serviceId?: string;
  serviceTitle?: string;
  courseId?: string;
  courseTitle?: string;
  disputeId?: string;
  orderId?: string;
  reason?: string;
  verdict?: string;
}

export interface SystemEventPayload {
  userId: string;
  userName: string;
  userEmail: string;
  code?: string;
  resetToken?: string;
  dashboardUrl?: string;
  reason?: string;
}

export interface ServiceEventPayload {
  serviceId: string;
  serviceTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason?: string;
}

// ── Event names ──

export type EventName =
  // Commandes
  | "order.created"
  | "order.accepted"
  | "order.in_progress"
  | "order.delivered"
  | "order.completed"
  | "order.cancelled"
  | "order.revision_requested"
  | "order.deadline_24h"
  | "order.deadline_overdue"
  // Offres
  | "offer.sent"
  | "offer.accepted"
  | "offer.rejected"
  // Messages
  | "message.received"
  // Avis
  | "review.received"
  // Agence
  | "agency.member_invited"
  | "agency.member_joined"
  | "agency.member_removed"
  | "agency.service_created"
  | "agency.service_approved"
  | "agency.service_rejected"
  | "agency.order_received"
  // Formations
  | "course.purchased"
  | "course.enrolled"
  | "course.completed"
  | "certificate.generated"
  | "course.new_lesson"
  | "course.reviewed"
  // Produits
  | "product.purchased"
  | "product.downloaded"
  // KYC
  | "kyc.submitted"
  | "kyc.approved"
  | "kyc.rejected"
  // Paiements
  | "payment.success"
  | "payment.failed"
  | "withdrawal.requested"
  | "withdrawal.approved"
  | "withdrawal.rejected"
  // Services
  | "service.approved"
  | "service.rejected"
  // Admin
  | "admin.new_user"
  | "admin.new_service"
  | "admin.new_course"
  | "admin.dispute_opened"
  | "admin.dispute_resolved"
  // Systeme
  | "system.welcome"
  | "system.email_verification"
  | "system.password_reset"
  | "system.account_suspended"
  | "system.account_banned";

// ── Type map pour typage fort de emitEvent() ──

export interface EventPayloadMap {
  "order.created": OrderEventPayload;
  "order.accepted": OrderEventPayload;
  "order.in_progress": OrderEventPayload;
  "order.delivered": OrderEventPayload;
  "order.completed": OrderEventPayload;
  "order.cancelled": OrderEventPayload;
  "order.revision_requested": OrderEventPayload;
  "order.deadline_24h": OrderEventPayload;
  "order.deadline_overdue": OrderEventPayload;

  "offer.sent": OfferEventPayload;
  "offer.accepted": OfferEventPayload;
  "offer.rejected": OfferEventPayload;

  "message.received": MessageEventPayload;

  "review.received": ReviewEventPayload;

  "agency.member_invited": AgencyEventPayload;
  "agency.member_joined": AgencyEventPayload;
  "agency.member_removed": AgencyEventPayload;
  "agency.service_created": AgencyEventPayload;
  "agency.service_approved": AgencyEventPayload;
  "agency.service_rejected": AgencyEventPayload;
  "agency.order_received": AgencyEventPayload;

  "course.purchased": CourseEventPayload;
  "course.enrolled": CourseEventPayload;
  "course.completed": CourseEventPayload;
  "certificate.generated": CourseEventPayload;
  "course.new_lesson": CourseEventPayload;
  "course.reviewed": CourseEventPayload;

  "product.purchased": ProductEventPayload;
  "product.downloaded": ProductEventPayload;

  "kyc.submitted": KycEventPayload;
  "kyc.approved": KycEventPayload;
  "kyc.rejected": KycEventPayload;

  "payment.success": PaymentEventPayload;
  "payment.failed": PaymentEventPayload;
  "withdrawal.requested": WithdrawalEventPayload;
  "withdrawal.approved": WithdrawalEventPayload;
  "withdrawal.rejected": WithdrawalEventPayload;

  "service.approved": ServiceEventPayload;
  "service.rejected": ServiceEventPayload;

  "admin.new_user": AdminEventPayload;
  "admin.new_service": AdminEventPayload;
  "admin.new_course": AdminEventPayload;
  "admin.dispute_opened": AdminEventPayload;
  "admin.dispute_resolved": AdminEventPayload;

  "system.welcome": SystemEventPayload;
  "system.email_verification": SystemEventPayload;
  "system.password_reset": SystemEventPayload;
  "system.account_suspended": SystemEventPayload;
  "system.account_banned": SystemEventPayload;
}

// ── Notification output du registry ──

export interface NotificationOutput {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}
