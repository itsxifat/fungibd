/** Emails that can be previewed from Admin → Settings → Email (see /api/admin/email-preview). */
export const EMAIL_PREVIEWS = {
  placed: "Order received",
  "preorder-placed": "Pre-order booked",
  confirmed: "Order confirmed",
  "preorder-ready": "Pre-order harvested",
  out: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  welcome: "Welcome",
  reset: "Password reset",
  campaign: "Marketing email",
  "admin-order": "Team alert · new order",
  "admin-lead": "Team alert · wholesale",
} as const;
