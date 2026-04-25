# Spec: Dispute Flow Fix

When client sets order status to "litige", a Dispute record must be created in the database so that admin can see and resolve it.

## Current behavior
- Client calls PATCH /api/orders/[id] with status: "litige"
- Order.status → LITIGE, Order.escrowStatus → DISPUTED
- No Dispute record created
- Admin queries prisma.dispute.findMany() → empty

## Expected behavior
- Same PATCH call also creates prisma.dispute.create() in the transaction
- Admin sees the dispute in /admin/litiges
- Dispute includes: orderId, clientId, freelanceId, reason, clientArgument
- Admin notification created

## Files
- `apps/web/app/api/orders/[id]/route.ts` — add dispute creation in Prisma LITIGE branch
