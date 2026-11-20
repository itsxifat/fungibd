export type Tone = "amber" | "blue" | "violet" | "sky" | "green" | "red" | "gray" | "brand" | "gold" | "rose";

type Labeled = { en: string; bn: string; tone: Tone };

export const ORDER_STATUS = {
  PENDING: { en: "Pending", bn: "অপেক্ষমাণ", tone: "amber" },
  CONFIRMED: { en: "Confirmed", bn: "নিশ্চিত হয়েছে", tone: "blue" },
  PROCESSING: { en: "Packing", bn: "প্যাক হচ্ছে", tone: "violet" },
  OUT_FOR_DELIVERY: { en: "Out for delivery", bn: "ডেলিভারির পথে", tone: "sky" },
  DELIVERED: { en: "Delivered", bn: "ডেলিভারি সম্পন্ন", tone: "green" },
  CANCELLED: { en: "Cancelled", bn: "বাতিল", tone: "red" },
  RETURNED: { en: "Returned", bn: "ফেরত", tone: "gray" },
} satisfies Record<string, Labeled>;
export type OrderStatus = keyof typeof ORDER_STATUS;
export const ORDER_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"];
export const OPEN_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY"];
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  PROCESSING: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED", "CANCELLED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const ORDER_SOURCES = { WEB: "Website", PHONE: "Phone call", FACEBOOK: "Facebook", WHATSAPP: "WhatsApp", ADMIN: "Admin / walk-in" } as const;

export const ORDER_TYPE = {
  REGULAR: { en: "Regular", bn: "সাধারণ", tone: "brand" },
  PREORDER: { en: "Pre-order", bn: "প্রি-অর্ডার", tone: "gold" },
} satisfies Record<string, Labeled>;

export const LEAD_STATUS = {
  NEW: { en: "New", bn: "নতুন", tone: "sky" },
  CONTACTED: { en: "Contacted", bn: "যোগাযোগ হয়েছে", tone: "blue" },
  QUALIFIED: { en: "Qualified", bn: "আগ্রহী", tone: "violet" },
  NEGOTIATION: { en: "Negotiation", bn: "আলোচনা চলছে", tone: "amber" },
  WON: { en: "Won", bn: "সফল", tone: "green" },
  LOST: { en: "Lost", bn: "হাতছাড়া", tone: "gray" },
} satisfies Record<string, Labeled>;
export type LeadStatus = keyof typeof LEAD_STATUS;
export const LEAD_PIPELINE: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST"];

export const LEAD_TYPES = { RETAIL: "Retail buyer", WHOLESALE: "Wholesale", RESTAURANT: "Restaurant / Hotel", DISTRIBUTOR: "Distributor / Shop", OTHER: "Other" } as const;
export const LEAD_SOURCES = {
  WEBSITE: "Website",
  HARVEST_ALERT: "Harvest alert signup",
  WHOLESALE_FORM: "Wholesale form",
  FACEBOOK: "Facebook",
  PHONE: "Phone",
  REFERRAL: "Referral",
  EVENT: "Event / Fair",
  OTHER: "Other",
} as const;

export const ACTIVITY_TYPES = { CALL: "Phone call", WHATSAPP: "WhatsApp", EMAIL: "Email", SMS: "SMS", MEETING: "Meeting", VISIT: "Visit", NOTE: "Note" } as const;

export const TICKET_STATUS = {
  OPEN: { en: "Open", bn: "খোলা", tone: "amber" },
  PENDING: { en: "Waiting on customer", bn: "উত্তরের অপেক্ষায়", tone: "blue" },
  RESOLVED: { en: "Resolved", bn: "সমাধান হয়েছে", tone: "green" },
  CLOSED: { en: "Closed", bn: "বন্ধ", tone: "gray" },
} satisfies Record<string, Labeled>;
export const TICKET_PRIORITY = {
  LOW: { en: "Low", bn: "কম", tone: "gray" },
  NORMAL: { en: "Normal", bn: "সাধারণ", tone: "blue" },
  HIGH: { en: "High", bn: "জরুরি", tone: "amber" },
  URGENT: { en: "Urgent", bn: "অতি জরুরি", tone: "red" },
} satisfies Record<string, Labeled>;
export const TICKET_CATEGORY = {
  ORDER: { en: "Order issue", bn: "অর্ডার সংক্রান্ত" },
  DELIVERY: { en: "Delivery", bn: "ডেলিভারি" },
  QUALITY: { en: "Product quality", bn: "পণ্যের মান" },
  WHOLESALE: { en: "Wholesale / bulk", bn: "পাইকারি" },
  FEEDBACK: { en: "Feedback", bn: "মতামত" },
  GENERAL: { en: "General question", bn: "সাধারণ প্রশ্ন" },
} as const;

export const EXPENSE_CATEGORIES = {
  RENT: "Rent (farm / office)",
  SALARY: "Salary & wages",
  UTILITIES: "Electricity, water & gas",
  TRANSPORT: "Transport & fuel",
  MARKETING: "Marketing & ads",
  EQUIPMENT: "Equipment & tools",
  MAINTENANCE: "Repair & maintenance",
  FEES: "Fees, internet & software",
  OTHER: "Other",
} as const;
export const PAY_METHODS = { CASH: "Cash", BKASH: "bKash", NAGAD: "Nagad", BANK: "Bank", CARD: "Card" } as const;

export const SUPPLY_CATEGORIES = { PRODUCTION: "Production (spawn, substrate…)", PACKAGING: "Packaging", OTHER: "Other" } as const;

export const BATCH_STATUS = {
  GROWING: { en: "Growing", bn: "বাড়ছে", tone: "sky" },
  HARVESTING: { en: "Harvesting", bn: "হারভেস্ট চলছে", tone: "green" },
  COMPLETED: { en: "Completed", bn: "শেষ", tone: "gray" },
  FAILED: { en: "Failed / contaminated", bn: "নষ্ট", tone: "red" },
} satisfies Record<string, Labeled>;

export const STOCK_REASONS = {
  HARVEST: "Harvest",
  ORDER: "Sold (order)",
  PREORDER_FULFIL: "Pre-order fulfilled",
  ORDER_CANCEL: "Order cancelled (restocked)",
  RETURN: "Returned to stock",
  SPOILAGE: "Spoilage / waste",
  ADJUST: "Manual adjustment",
} as const;

export const SEGMENTS = {
  NEW: { en: "New", bn: "নতুন ক্রেতা", tone: "sky", hint: "1 order, bought recently" },
  ACTIVE: { en: "Active", bn: "নিয়মিত", tone: "green", hint: "2+ orders, bought recently" },
  LOYAL: { en: "Loyal / VIP", bn: "বিশ্বস্ত", tone: "gold", hint: "Many orders, bought recently" },
  AT_RISK: { en: "At risk", bn: "ঝুঁকিতে", tone: "amber", hint: "Hasn't ordered for a while" },
  LOST: { en: "Lost", bn: "হারিয়ে গেছে", tone: "red", hint: "No order for a long time" },
  PROSPECT: { en: "Prospect", bn: "সম্ভাব্য", tone: "gray", hint: "Account but no orders" },
} satisfies Record<string, Labeled & { hint: string }>;
export type Segment = keyof typeof SEGMENTS;

export const ADMIN_ROLES = { OWNER: "Owner (full access)", MANAGER: "Manager (no users/settings)", STAFF: "Staff (orders, delivery, support)" } as const;
export type AdminRole = keyof typeof ADMIN_ROLES;

export const COUPON_TYPES = { PERCENT: "Percent off", FIXED: "Fixed amount off", FREE_DELIVERY: "Free delivery" } as const;
