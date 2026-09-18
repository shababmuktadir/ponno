/**
 * MASTER FEATURE CATALOG
 * -----------------------
 * প্রতিটা page এর সব possible feature এখানে defined।
 * Admin Package Manager এখান থেকে list পড়ে UI বানাবে।
 * কোনো feature add করতে হলে এখানে যোগ করলেই সব জায়গায় auto দেখাবে।
 */

export const PAGES = [
  { id: "dashboard",       label: "ড্যাশবোর্ড",        icon: "LayoutDashboard" },
  { id: "product",         label: "প্রোডাক্ট",          icon: "Package" },
  { id: "category",        label: "ক্যাটাগরি",          icon: "Tags" },
  { id: "stock",           label: "স্টক",              icon: "Boxes" },
  { id: "stockDashboard",  label: "স্টক ড্যাশবোর্ড",    icon: "BarChart3" },
  { id: "income",          label: "আয়",               icon: "Wallet" },
  { id: "report",          label: "রিপোর্ট",           icon: "FileText" },
  { id: "invoice",         label: "ইনভয়েস",           icon: "Receipt" },
  { id: "customer",        label: "কাস্টমার",          icon: "Users" },
  { id: "user",            label: "ইউজার",             icon: "UserCog" },
  { id: "sms",             label: "এসএমএস",            icon: "MessageSquare" },
  { id: "chat",            label: "চ্যাট",             icon: "MessagesSquare" },
  { id: "notification",    label: "নোটিফিকেশন",        icon: "Bell" },
];

/**
 * প্রতিটা page এর features।
 * kind: "boolean"  → শুধু enable/disable
 * kind: "limit"    → enable + numeric limit + unlimited toggle
 * kind: "text"     → enable + text value (config)
 */
export const FEATURES = {
  dashboard: [
    { id: "salesSummary",       label: "বিক্রয় সারসংক্ষেপ",       kind: "boolean" },
    { id: "todaySales",         label: "আজকের বিক্রয়",            kind: "boolean" },
    { id: "todayExpense",       label: "আজকের খরচ",              kind: "boolean" },
    { id: "stockSummary",       label: "স্টক সারসংক্ষেপ",         kind: "boolean" },
    { id: "lowStockAlert",      label: "কম স্টক সতর্কতা",        kind: "boolean" },
    { id: "totalProducts",      label: "মোট প্রোডাক্ট",           kind: "boolean" },
    { id: "totalCustomers",     label: "মোট কাস্টমার",            kind: "boolean" },
    { id: "recentInvoices",     label: "সাম্প্রতিক ইনভয়েস",        kind: "boolean" },
    { id: "incomeChart",        label: "আয় চার্ট",               kind: "boolean" },
    { id: "profitLoss",         label: "লাভ/ক্ষতি",              kind: "boolean" },
    { id: "advancedAnalytics",  label: "অ্যাডভান্সড এনালিটিক্স",    kind: "boolean" },
    { id: "customDateRange",    label: "কাস্টম তারিখ পরিসীমা",     kind: "boolean" },
    { id: "export",             label: "ড্যাশবোর্ড এক্সপোর্ট",       kind: "boolean" },
  ],

  product: [
    { id: "add",           label: "প্রোডাক্ট যোগ",           kind: "boolean" },
    { id: "edit",          label: "প্রোডাক্ট এডিট",           kind: "boolean" },
    { id: "delete",        label: "প্রোডাক্ট ডিলিট",          kind: "boolean" },
    { id: "search",        label: "সার্চ",                 kind: "boolean" },
    { id: "sku",           label: "SKU",                  kind: "boolean" },
    { id: "barcode",       label: "বারকোড",               kind: "boolean" },
    { id: "image",         label: "প্রোডাক্ট ছবি",           kind: "boolean" },
    { id: "imageLimit",    label: "প্রতি প্রোডাক্টে ছবি",     kind: "limit", unit: "টি" },
    { id: "description",   label: "বিবরণ",                kind: "boolean" },
    { id: "supplier",      label: "সাপ্লায়ার",              kind: "boolean" },
    { id: "purchasePrice", label: "ক্রয় মূল্য",              kind: "boolean" },
    { id: "sellingPrice",  label: "বিক্রয় মূল্য",             kind: "boolean" },
    { id: "variants",      label: "ভ্যারিয়েন্ট",              kind: "boolean" },
    { id: "tags",          label: "ট্যাগ",                 kind: "boolean" },
    { id: "import",        label: "XLSX ইমপোর্ট",            kind: "boolean" },
    { id: "export",        label: "XLSX এক্সপোর্ট",           kind: "boolean" },
    { id: "bulkEdit",      label: "বাল্ক এডিট",              kind: "boolean" },
    { id: "productLimit",  label: "সর্বোচ্চ প্রোডাক্ট",        kind: "limit", unit: "টি" },
  ],

  category: [
    { id: "add",          label: "ক্যাটাগরি যোগ",         kind: "boolean" },
    { id: "edit",         label: "ক্যাটাগরি এডিট",         kind: "boolean" },
    { id: "delete",       label: "ক্যাটাগরি ডিলিট",        kind: "boolean" },
    { id: "search",       label: "সার্চ",               kind: "boolean" },
    { id: "image",        label: "ক্যাটাগরি ছবি",          kind: "boolean" },
    { id: "banner",       label: "ক্যাটাগরি ব্যানার",        kind: "boolean" },
    { id: "description",  label: "বিবরণ",               kind: "boolean" },
    { id: "sorting",      label: "সাজানো",               kind: "boolean" },
    { id: "status",       label: "সক্রিয়/নিষ্ক্রিয়",         kind: "boolean" },
    { id: "seo",          label: "SEO ফিল্ড",             kind: "boolean" },
    { id: "hierarchy",    label: "শ্রেণীবিন্যাস",           kind: "boolean" },
    { id: "bulk",         label: "বাল্ক ম্যানেজ",           kind: "boolean" },
    { id: "import",       label: "ইমপোর্ট",               kind: "boolean" },
    { id: "export",       label: "এক্সপোর্ট",              kind: "boolean" },
    { id: "categoryLimit",label: "সর্বোচ্চ ক্যাটাগরি",       kind: "limit", unit: "টি" },
  ],

  stock: [
    { id: "in",          label: "স্টক ইন",              kind: "boolean" },
    { id: "out",         label: "স্টক আউট",             kind: "boolean" },
    { id: "adjustment",  label: "ম্যানুয়াল অ্যাডজাস্ট",     kind: "boolean" },
    { id: "transfer",    label: "স্টক ট্রান্সফার",         kind: "boolean" },
    { id: "history",     label: "স্টক হিস্টোরি",           kind: "boolean" },
    { id: "valuation",   label: "স্টক ভ্যালুয়েশন",       kind: "boolean" },
    { id: "lowAlert",    label: "কম স্টক অটো অ্যালার্ট",   kind: "boolean" },
    { id: "forecasting", label: "স্টক পূর্বাভাস",           kind: "boolean" },
    { id: "filter",      label: "ফিল্টার",               kind: "boolean" },
    { id: "dateFilter",  label: "তারিখ ফিল্টার",           kind: "boolean" },
    { id: "export",      label: "এক্সেল/PDF এক্সপোর্ট",     kind: "boolean" },
    { id: "stockLimit",  label: "সর্বোচ্চ স্টক এন্ট্রি",     kind: "limit", unit: "টি" },
  ],

  stockDashboard: [
    { id: "totalStock",     label: "মোট স্টক",             kind: "boolean" },
    { id: "lowStock",       label: "কম স্টক",              kind: "boolean" },
    { id: "outOfStock",     label: "স্টক নেই",              kind: "boolean" },
    { id: "stockValue",     label: "স্টক মূল্য",             kind: "boolean" },
    { id: "productCount",   label: "প্রোডাক্ট সংখ্যা",        kind: "boolean" },
    { id: "basicChart",     label: "বেসিক চার্ট",            kind: "boolean" },
    { id: "advancedChart",  label: "অ্যাডভান্সড চার্ট",       kind: "boolean" },
    { id: "fastMoving",     label: "দ্রুত বিক্রি",            kind: "boolean" },
    { id: "slowMoving",     label: "ধীর বিক্রি",            kind: "boolean" },
    { id: "deadStock",      label: "ডেড স্টক",             kind: "boolean" },
    { id: "turnover",       label: "স্টক টার্নওভার",         kind: "boolean" },
    { id: "dateCompare",    label: "তারিখ তুলনা",           kind: "boolean" },
    { id: "categoryFilter", label: "ক্যাটাগরি ফিল্টার",       kind: "boolean" },
    { id: "export",         label: "এক্সপোর্ট",              kind: "boolean" },
  ],

  income: [
    { id: "add",          label: "আয় যোগ",              kind: "boolean" },
    { id: "edit",         label: "আয় এডিট",              kind: "boolean" },
    { id: "delete",       label: "আয় ডিলিট",             kind: "boolean" },
    { id: "category",     label: "আয় ক্যাটাগরি",           kind: "boolean" },
    { id: "source",       label: "আয়ের উৎস",              kind: "boolean" },
    { id: "notes",        label: "নোট",                  kind: "boolean" },
    { id: "attachments",  label: "সংযুক্তি",              kind: "boolean" },
    { id: "recurring",    label: "পুনরাবৃত্ত আয়",           kind: "boolean" },
    { id: "chart",        label: "আয় চার্ট",              kind: "boolean" },
    { id: "dateFilter",   label: "তারিখ ফিল্টার",           kind: "boolean" },
    { id: "analytics",    label: "অ্যাডভান্সড এনালিটিক্স",    kind: "boolean" },
    { id: "export",       label: "এক্সেল/PDF এক্সপোর্ট",    kind: "boolean" },
  ],

  report: [
    { id: "sales",       label: "বিক্রয় রিপোর্ট",         kind: "boolean" },
    { id: "income",      label: "আয় রিপোর্ট",            kind: "boolean" },
    { id: "stock",       label: "স্টক রিপোর্ট",           kind: "boolean" },
    { id: "customer",    label: "কাস্টমার রিপোর্ট",        kind: "boolean" },
    { id: "product",     label: "প্রোডাক্ট রিপোর্ট",        kind: "boolean" },
    { id: "profit",      label: "লাভ রিপোর্ট",            kind: "boolean" },
    { id: "supplier",    label: "সাপ্লায়ার রিপোর্ট",        kind: "boolean" },
    { id: "daily",       label: "দৈনিক রিপোর্ট",           kind: "boolean" },
    { id: "weekly",      label: "সাপ্তাহিক রিপোর্ট",        kind: "boolean" },
    { id: "monthly",     label: "মাসিক রিপোর্ট",           kind: "boolean" },
    { id: "custom",      label: "কাস্টম রিপোর্ট",           kind: "boolean" },
    { id: "pdf",         label: "PDF এক্সপোর্ট",          kind: "boolean" },
    { id: "xlsx",        label: "XLSX এক্সপোর্ট",         kind: "boolean" },
    { id: "reportLimit", label: "মাসিক রিপোর্ট সীমা",      kind: "limit", unit: "টি/মাস" },
  ],

  invoice: [
    { id: "create",       label: "ইনভয়েস তৈরি",           kind: "boolean" },
    { id: "edit",         label: "ইনভয়েস এডিট",            kind: "boolean" },
    { id: "delete",       label: "ইনভয়েস ডিলিট",          kind: "boolean" },
    { id: "print",        label: "প্রিন্ট",                kind: "boolean" },
    { id: "pdf",          label: "PDF",                   kind: "boolean" },
    { id: "logo",         label: "লোগো",                  kind: "boolean" },
    { id: "templates",    label: "একাধিক টেম্পলেট",         kind: "boolean" },
    { id: "discount",     label: "ডিসকাউন্ট",              kind: "boolean" },
    { id: "tax",          label: "ট্যাক্স",                 kind: "boolean" },
    { id: "paymentStatus",label: "পেমেন্ট স্ট্যাটাস",       kind: "boolean" },
    { id: "share",        label: "শেয়ার",                kind: "boolean" },
    { id: "invoiceLimit", label: "মাসিক ইনভয়েস সীমা",      kind: "limit", unit: "টি/মাস" },
  ],

  customer: [
    { id: "add",       label: "কাস্টমার যোগ",         kind: "boolean" },
    { id: "edit",      label: "কাস্টমার এডিট",         kind: "boolean" },
    { id: "delete",    label: "কাস্টমার ডিলিট",        kind: "boolean" },
    { id: "search",    label: "সার্চ",               kind: "boolean" },
    { id: "photo",     label: "কাস্টমার ছবি",          kind: "boolean" },
    { id: "phone",     label: "ফোন",                 kind: "boolean" },
    { id: "email",     label: "ইমেইল",                kind: "boolean" },
    { id: "address",   label: "ঠিকানা",              kind: "boolean" },
    { id: "history",   label: "ক্রয় ইতিহাস",          kind: "boolean" },
    { id: "balance",   label: "বাকি ট্র্যাকিং",        kind: "boolean" },
    { id: "notes",     label: "নোট",                 kind: "boolean" },
    { id: "groups",    label: "কাস্টমার গ্রুপ",        kind: "boolean" },
    { id: "tags",      label: "ট্যাগ",                kind: "boolean" },
    { id: "emailMarketing", label: "ইমেইল মার্কেটিং",  kind: "boolean" },
    { id: "smsMarketing",   label: "SMS মার্কেটিং",   kind: "boolean" },
    { id: "export",    label: "এক্সেল এক্সপোর্ট",       kind: "boolean" },
    { id: "customerLimit", label: "সর্বোচ্চ কাস্টমার",   kind: "limit", unit: "টি" },
  ],

  user: [
    { id: "owner",        label: "ওনার অ্যাকাউন্ট",       kind: "boolean" },
    { id: "profile",      label: "প্রোফাইল",              kind: "boolean" },
    { id: "password",     label: "পাসওয়ার্ড পরিবর্তন",     kind: "boolean" },
    { id: "image",        label: "প্রোফাইল ছবি",           kind: "boolean" },
    { id: "settings",     label: "অ্যাকাউন্ট সেটিংস",       kind: "boolean" },
    { id: "staffInvite",  label: "স্টাফ ইনভাইট",           kind: "boolean" },
    { id: "roles",        label: "কাস্টম রোল",             kind: "boolean" },
    { id: "permissions",  label: "পারমিশন",              kind: "boolean" },
    { id: "activity",     label: "অ্যাক্টিভিটি লগ",         kind: "boolean" },
    { id: "loginHistory", label: "লগইন হিস্টোরি",         kind: "boolean" },
    { id: "status",       label: "ইউজার স্ট্যাটাস",         kind: "boolean" },
    { id: "userLimit",    label: "সর্বোচ্চ ইউজার",          kind: "limit", unit: "জন" },
  ],

  sms: [
    { id: "send",          label: "SMS পাঠান",           kind: "boolean" },
    { id: "history",       label: "SMS হিস্টোরি",         kind: "boolean" },
    { id: "templates",     label: "টেম্পলেট",             kind: "boolean" },
    { id: "customSms",     label: "কাস্টম SMS",          kind: "boolean" },
    { id: "customerSms",   label: "কাস্টমার SMS",         kind: "boolean" },
    { id: "bulk",          label: "বাল্ক ক্যাম্পেইন",        kind: "boolean" },
    { id: "schedule",      label: "সময়সূচি SMS",          kind: "boolean" },
    { id: "delivery",      label: "ডেলিভারি স্ট্যাটাস",    kind: "boolean" },
    { id: "balanceCheck",  label: "ব্যালেন্স চেক",         kind: "boolean" },
    { id: "analytics",     label: "SMS এনালিটিক্স",       kind: "boolean" },
    { id: "groups",        label: "কাস্টমার গ্রুপ",        kind: "boolean" },
    { id: "smsLimit",      label: "মাসিক SMS সীমা",       kind: "limit", unit: "টি/মাস" },
  ],

  chat: [
    { id: "enabled",         label: "চ্যাট সক্রিয়",          kind: "boolean" },
    { id: "customerChat",    label: "কাস্টমার চ্যাট",        kind: "boolean" },
    { id: "staffChat",       label: "স্টাফ চ্যাট",           kind: "boolean" },
    { id: "groups",          label: "গ্রুপ চ্যাট",           kind: "boolean" },
    { id: "text",            label: "টেক্সট মেসেজ",          kind: "boolean" },
    { id: "image",           label: "ছবি শেয়ার",            kind: "boolean" },
    { id: "file",            label: "ফাইল শেয়ার",            kind: "boolean" },
    { id: "voice",           label: "ভয়েস মেসেজ",           kind: "boolean" },
    { id: "history",         label: "চ্যাট হিস্টোরি",          kind: "boolean" },
    { id: "search",          label: "মেসেজ সার্চ",           kind: "boolean" },
    { id: "readStatus",      label: "রিড স্ট্যাটাস",          kind: "boolean" },
    { id: "onlineStatus",    label: "অনলাইন স্ট্যাটাস",       kind: "boolean" },
    { id: "typing",          label: "টাইপিং ইন্ডিকেটর",        kind: "boolean" },
    { id: "notifications",   label: "চ্যাট নোটিফিকেশন",       kind: "boolean" },
    { id: "chatLimit",       label: "মাসিক চ্যাট সীমা",      kind: "limit", unit: "টি" },
  ],

  notification: [
    { id: "stockAlert",     label: "স্টক অ্যালার্ট",         kind: "boolean" },
    { id: "salesAlert",     label: "বিক্রয় অ্যালার্ট",       kind: "boolean" },
    { id: "invoiceAlert",   label: "ইনভয়েস অ্যালার্ট",       kind: "boolean" },
    { id: "paymentAlert",   label: "পেমেন্ট অ্যালার্ট",      kind: "boolean" },
    { id: "customerAlert",  label: "কাস্টমার অ্যালার্ট",      kind: "boolean" },
    { id: "smsAlert",       label: "SMS অ্যালার্ট",         kind: "boolean" },
    { id: "systemAlert",    label: "সিস্টেম অ্যালার্ট",        kind: "boolean" },
    { id: "customAlert",    label: "কাস্টম অ্যালার্ট",         kind: "boolean" },
    { id: "list",           label: "নোটিফিকেশন লিস্ট",       kind: "boolean" },
    { id: "markRead",       label: "মার্ক অ্যাজ রিড",        kind: "boolean" },
    { id: "delete",         label: "ডিলিট",                kind: "boolean" },
    { id: "counter",        label: "কাউন্টার",               kind: "boolean" },
    { id: "filters",        label: "ফিল্টার",                kind: "boolean" },
    { id: "preferences",    label: "প্রেফারেন্স",             kind: "boolean" },
    { id: "automation",     label: "অটোমেশন রুল",           kind: "boolean" },
  ],
};

/**
 * Global limits (সব package এ থাকবে, তবে value ভিন্ন)
 * এগুলো সব page মিলে shared।
 */
export const GLOBAL_LIMITS = [
  { id: "storage",  label: "স্টোরেজ",          unit: "MB",  default: 1024 },
  { id: "fileUpload", label: "ফাইল আপলোড",      unit: "MB",  default: 0, isFileLimit: true },
];

/**
 * Usage counters যা track করতে হবে।
 */
export const USAGE_KEYS = [
  { id: "products",   label: "প্রোডাক্ট",     limitKey: "productLimit" },
  { id: "categories", label: "ক্যাটাগরি",     limitKey: "categoryLimit" },
  { id: "customers",  label: "কাস্টমার",      limitKey: "customerLimit" },
  { id: "users",      label: "ইউজার",        limitKey: "userLimit" },
  { id: "invoices",   label: "ইনভয়েস",       limitKey: "invoiceLimit", period: "month" },
  { id: "sms",        label: "এসএমএস",         limitKey: "smsLimit",     period: "month" },
  { id: "reports",    label: "রিপোর্ট",        limitKey: "reportLimit",  period: "month" },
  { id: "storage",    label: "স্টোরেজ",       limitKey: "storage",       unit: "MB" },
];

/**
 * Helper — একটি page এর সব feature এর default মান তৈরি করে
 */
export function buildEmptyPageFeatureSet(pageId, defaultEnabled = false) {
  const list = FEATURES[pageId] || [];
  const out = {};
  for (const f of list) {
    if (f.kind === "limit") {
      out[f.id] = {
        enabled: defaultEnabled,
        value: defaultEnabled ? 10 : 0,
        unlimited: false,
      };
    } else {
      out[f.id] = { enabled: defaultEnabled };
    }
  }
  return out;
}

/**
 * Full blank feature tree (সব page)
 */
export function buildEmptyFeatureTree(defaultEnabled = false) {
  const out = {};
  for (const p of PAGES) {
    out[p.id] = {
      access: defaultEnabled,
      features: buildEmptyPageFeatureSet(p.id, defaultEnabled),
    };
  }
  return out;
}