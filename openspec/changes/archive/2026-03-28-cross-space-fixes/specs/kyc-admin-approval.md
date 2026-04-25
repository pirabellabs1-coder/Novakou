# Spec: KYC Admin Approval/Rejection

Admin must be able to approve or reject KYC requests from the admin panel, updating the user's KYC level.

## Current behavior
- GET /api/admin/kyc returns pending KYC requests (works)
- No POST/PATCH handler to approve/reject
- Admin store functions call endpoints that don't handle the action

## Expected behavior
- POST /api/admin/kyc with { action: "approve"|"reject", requestId, reason? }
- Approve: KycRequest.status → APPROUVE, User.kyc → requestedLevel
- Reject: KycRequest.status → REFUSE, rejectionReason set
- Notification sent to user
- Audit log created

## Files
- `apps/web/app/api/admin/kyc/route.ts` — add POST handler
