import { buildEmptyFeatureTree, FEATURES, PAGES } from "./features";

/**
 * Helper — page feature set partially enabled
 * enableList: feature ids to enable (with limit value if limit)
 */
function page(access, enableList = [], limits = {}) {
  const out = { access, features: {} };
  // include every possible feature, mark enabled only if in enableList
  return { access, enableList, limits };
}

/**
 * Convert "enableList" form to full tree at load time
 * (keeps the seed data concise)
 */
export function expandPackage(seed) {
  const tree = buildEmptyFeatureTree(false);
  for (const pageId of Object.keys(tree)) {
    tree[pageId] = { access: false, features: {} };
  }

  for (const [pageId, cfg] of Object.entries(seed.pages || {})) {
    const pageDef = { access: !!cfg.access, features: {} };
    const all = FEATURES[pageId] || [];
    for (const f of all) {
      if (f.kind === "limit") {
        const lim = cfg.limits?.[f.id] || { enabled: false, value: 0, unlimited: false };
        pageDef.features[f.id] = {
          enabled: !!lim.enabled,
          value: Number(lim.value) || 0,
          unlimited: !!lim.unlimited,
        };
      } else {
        const enabled = Array.isArray(cfg.enable)
          ? cfg.enable.includes(f.id)
          : !!cfg.features?.[f.id]?.enabled;
        pageDef.features[f.id] = { enabled };
      }
    }
    tree[pageId] = pageDef;
  }
  return tree;
}

/* ------------------------------------------------------------------
   DEFAULT 5 PACKAGES
   ------------------------------------------------------------------ */

export const DEFAULT_PRICING_SETTINGS = {
  yearlyDiscount: 15,
  fiveYearDiscount: 30,
  currency: "BDT",
  currencySymbol: "৳",
  yearlyEnabled: true,
  fiveYearEnabled: true,
};

export const DEFAULT_PACKAGES = [
  /* ============================================================
     PACKAGE 1 — STARTER
     ============================================================ */
  {
    id: "starter",
    name: "Starter",
    badge: "স্টার্টার",
    description: "ছোট ব্যবসার জন্য — শুরু করার জন্য আদর্শ।",
    icon: "Sparkles",
    color: "#9CA3AF",
    monthlyPrice: 650,
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    active: true,
    order: 1,
    popular: false,

    limits: {
      productLimit:    { enabled: true, value: 50,   unlimited: false },
      categoryLimit:   { enabled: true, value: 20,   unlimited: false },
      customerLimit:   { enabled: true, value: 100,  unlimited: false },
      userLimit:       { enabled: true, value: 1,    unlimited: false },
      invoiceLimit:    { enabled: true, value: 10,   unlimited: false, period: "day" },
      smsLimit:        { enabled: true, value: 100,  unlimited: false, period: "month" },
      reportLimit:     { enabled: true, value: 10,   unlimited: false, period: "month" },
      stockLimit:      { enabled: true, value: 500,  unlimited: false },
      chatLimit:       { enabled: false, value: 0,   unlimited: false },
      imageLimit:      { enabled: true, value: 1,    unlimited: false },
      storage:         { enabled: true, value: 2048, unlimited: false, unit: "MB" },
      fileUpload:      { enabled: false, value: 0,   unlimited: false, unit: "MB" },
    },

    pages: {
      dashboard: {
        access: true,
        enable: [
          "salesSummary","todaySales","todayExpense","stockSummary",
          "lowStockAlert","totalProducts","totalCustomers","recentInvoices",
          "incomeChart","profitLoss",
        ],
      },
      product: {
        access: true,
        enable: [
          "add","edit","delete","search","sku","barcode","description",
          "purchasePrice","sellingPrice",
        ],
        limits: { productLimit: { enabled: true, value: 50, unlimited: false } },
      },
      category: {
        access: true,
        enable: ["add","edit","delete","search","description","productCount"],
        limits: { categoryLimit: { enabled: true, value: 20, unlimited: false } },
      },
      stock: {
        access: true,
        enable: ["in","out","adjustment","history","lowAlert","filter"],
        limits: { stockLimit: { enabled: true, value: 500, unlimited: false } },
      },
      stockDashboard: {
        access: true,
        enable: ["totalStock","lowStock","outOfStock","stockValue","productCount","basicChart","categoryFilter"],
      },
      income: {
        access: true,
        enable: ["add","edit","delete","category","notes","search"],
      },
      report: {
        access: true,
        enable: ["sales","income","stock","xlsx"],
        limits: { reportLimit: { enabled: true, value: 10, unlimited: false, period: "month" } },
      },
      invoice: {
        access: true,
        enable: ["create","edit","delete","print","discount","tax"],
        limits: { invoiceLimit: { enabled: true, value: 10, unlimited: false, period: "day" } },
      },
      customer: {
        access: true,
        enable: ["add","edit","delete","search","phone","address","history","balance","notes"],
        limits: { customerLimit: { enabled: true, value: 100, unlimited: false } },
      },
      user: {
        access: true,
        enable: ["owner","profile","password","image","settings"],
        limits: { userLimit: { enabled: true, value: 1, unlimited: false } },
      },
      sms: {
        access: true,
        enable: ["send","history","templates","customerSms","delivery","balanceCheck"],
        limits: { smsLimit: { enabled: true, value: 100, unlimited: false, period: "month" } },
      },
      chat: {
        access: false,
        enable: [],
        limits: { chatLimit: { enabled: false, value: 0, unlimited: false } },
      },
      notification: {
        access: true,
        enable: ["stockAlert","invoiceAlert","incomeAlert","list","markRead","delete","counter"],
      },
    },
  },

  /* ============================================================
     PACKAGE 2 — BASIC
     ============================================================ */
  {
    id: "basic",
    name: "Basic",
    badge: "বেসিক",
    description: "উদীয়মান ব্যবসার জন্য — দ্রুত বেড়ে ওঠার জন্য।",
    icon: "Zap",
    color: "#3B82F6",
    monthlyPrice: 1200,
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    active: true,
    order: 2,
    popular: false,

    limits: {
      productLimit:  { enabled: true, value: 500,   unlimited: false },
      categoryLimit: { enabled: true, value: 100,   unlimited: false },
      customerLimit: { enabled: true, value: 500,   unlimited: false },
      userLimit:     { enabled: true, value: 3,     unlimited: false },
      invoiceLimit:  { enabled: true, value: 500,   unlimited: false, period: "month" },
      smsLimit:      { enabled: true, value: 500,   unlimited: false, period: "month" },
      reportLimit:   { enabled: true, value: 20,    unlimited: false, period: "month" },
      stockLimit:    { enabled: true, value: 5000,  unlimited: false },
      chatLimit:     { enabled: true, value: 500,   unlimited: false },
      imageLimit:    { enabled: true, value: 3,     unlimited: false },
      storage:       { enabled: true, value: 5120,  unlimited: false, unit: "MB" },
      fileUpload:    { enabled: true, value: 5,     unlimited: false, unit: "MB" },
    },

    pages: {
      dashboard: {
        access: true,
        enable: [
          "salesSummary","todaySales","todayExpense","stockSummary",
          "lowStockAlert","totalProducts","totalCustomers","recentInvoices",
          "incomeChart","profitLoss","advancedAnalytics","customDateRange","export",
        ],
      },
      product: {
        access: true,
        enable: [
          "add","edit","delete","search","sku","barcode","image","description",
          "supplier","purchasePrice","sellingPrice","tags","import","export",
        ],
        limits: { productLimit: { enabled: true, value: 500, unlimited: false }, imageLimit: { enabled: true, value: 3, unlimited: false } },
      },
      category: {
        access: true,
        enable: ["add","edit","delete","search","image","banner","description","sorting","status","productCount","import","export"],
        limits: { categoryLimit: { enabled: true, value: 100, unlimited: false } },
      },
      stock: {
        access: true,
        enable: ["in","out","adjustment","history","valuation","lowAlert","filter","dateFilter","export"],
        limits: { stockLimit: { enabled: true, value: 5000, unlimited: false } },
      },
      stockDashboard: {
        access: true,
        enable: [
          "totalStock","lowStock","outOfStock","stockValue","productCount",
          "basicChart","advancedChart","fastMoving","slowMoving","categoryFilter","export",
        ],
      },
      income: {
        access: true,
        enable: ["add","edit","delete","category","source","notes","chart","dateFilter","export"],
      },
      report: {
        access: true,
        enable: ["sales","income","stock","customer","product","daily","weekly","monthly","xlsx"],
        limits: { reportLimit: { enabled: true, value: 20, unlimited: false, period: "month" } },
      },
      invoice: {
        access: true,
        enable: ["create","edit","delete","print","pdf","discount","tax","paymentStatus","share"],
        limits: { invoiceLimit: { enabled: true, value: 500, unlimited: false, period: "month" } },
      },
      customer: {
        access: true,
        enable: ["add","edit","delete","search","photo","phone","email","address","history","balance","notes","export"],
        limits: { customerLimit: { enabled: true, value: 500, unlimited: false } },
      },
      user: {
        access: true,
        enable: ["owner","profile","password","image","settings","staffInvite","activity","loginHistory","status"],
        limits: { userLimit: { enabled: true, value: 3, unlimited: false } },
      },
      sms: {
        access: true,
        enable: ["send","history","templates","customSms","customerSms","delivery","balanceCheck"],
        limits: { smsLimit: { enabled: true, value: 500, unlimited: false, period: "month" } },
      },
      chat: {
        access: true,
        enable: ["enabled","customerChat","staffChat","text","image","file","history","readStatus","onlineStatus","notifications"],
        limits: { chatLimit: { enabled: true, value: 500, unlimited: false } },
      },
      notification: {
        access: true,
        enable: ["stockAlert","salesAlert","invoiceAlert","paymentAlert","customerAlert","smsAlert","systemAlert","list","markRead","delete","counter"],
      },
    },
  },

  /* ============================================================
     PACKAGE 3 — BUSINESS
     ============================================================ */
  {
    id: "business",
    name: "Business",
    badge: "বিজনেস",
    description: "বর্ধনশীল ব্যবসার জন্য — অ্যাডভান্সড ফিচার সহ।",
    icon: "Rocket",
    color: "#F59E0B",
    monthlyPrice: 1800,
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    active: true,
    order: 3,
    popular: true,

    limits: {
      productLimit:  { enabled: true, value: 2000,   unlimited: false },
      categoryLimit: { enabled: true, value: 500,    unlimited: false },
      customerLimit: { enabled: true, value: 2000,   unlimited: false },
      userLimit:     { enabled: true, value: 10,     unlimited: false },
      invoiceLimit:  { enabled: true, value: 2000,   unlimited: false, period: "month" },
      smsLimit:      { enabled: true, value: 2000,   unlimited: false, period: "month" },
      reportLimit:   { enabled: true, value: 100,    unlimited: false, period: "month" },
      stockLimit:    { enabled: true, value: 20000,  unlimited: false },
      chatLimit:     { enabled: true, value: 5000,   unlimited: false },
      imageLimit:    { enabled: true, value: 5,      unlimited: false },
      storage:       { enabled: true, value: 10240,  unlimited: false, unit: "MB" },
      fileUpload:    { enabled: true, value: 10,     unlimited: false, unit: "MB" },
    },

    pages: {
      dashboard: {
        access: true,
        enable: [
          "salesSummary","todaySales","todayExpense","stockSummary",
          "lowStockAlert","totalProducts","totalCustomers","recentInvoices",
          "incomeChart","profitLoss","advancedAnalytics","customDateRange","export",
        ],
      },
      product: {
        access: true,
        enable: [
          "add","edit","delete","search","sku","barcode","image","description",
          "supplier","purchasePrice","sellingPrice","variants","tags","import","export","bulkEdit",
        ],
        limits: { productLimit: { enabled: true, value: 2000, unlimited: false }, imageLimit: { enabled: true, value: 5, unlimited: false } },
      },
      category: {
        access: true,
        enable: ["add","edit","delete","search","image","banner","description","sorting","status","seo","productCount","bulk","import","export"],
        limits: { categoryLimit: { enabled: true, value: 500, unlimited: false } },
      },
      stock: {
        access: true,
        enable: ["in","out","adjustment","transfer","history","valuation","lowAlert","filter","dateFilter","export"],
        limits: { stockLimit: { enabled: true, value: 20000, unlimited: false } },
      },
      stockDashboard: {
        access: true,
        enable: [
          "totalStock","lowStock","outOfStock","stockValue","productCount",
          "basicChart","advancedChart","fastMoving","slowMoving","turnover",
          "categoryFilter","dateCompare","export",
        ],
      },
      income: {
        access: true,
        enable: ["add","edit","delete","category","source","notes","attachments","recurring","chart","dateFilter","analytics","export"],
      },
      report: {
        access: true,
        enable: ["sales","income","stock","customer","product","profit","supplier","daily","weekly","monthly","custom","pdf","xlsx"],
        limits: { reportLimit: { enabled: true, value: 100, unlimited: false, period: "month" } },
      },
      invoice: {
        access: true,
        enable: ["create","edit","delete","print","pdf","logo","templates","discount","tax","paymentStatus","share"],
        limits: { invoiceLimit: { enabled: true, value: 2000, unlimited: false, period: "month" } },
      },
      customer: {
        access: true,
        enable: ["add","edit","delete","search","photo","phone","email","address","history","balance","notes","groups","tags","export"],
        limits: { customerLimit: { enabled: true, value: 2000, unlimited: false } },
      },
      user: {
        access: true,
        enable: ["owner","profile","password","image","settings","staffInvite","roles","permissions","activity","loginHistory","status"],
        limits: { userLimit: { enabled: true, value: 10, unlimited: false } },
      },
      sms: {
        access: true,
        enable: ["send","history","templates","customSms","customerSms","bulk","delivery","balanceCheck","analytics","groups"],
        limits: { smsLimit: { enabled: true, value: 2000, unlimited: false, period: "month" } },
      },
      chat: {
        access: true,
        enable: ["enabled","customerChat","staffChat","groups","text","image","file","history","search","readStatus","onlineStatus","notifications"],
        limits: { chatLimit: { enabled: true, value: 5000, unlimited: false } },
      },
      notification: {
        access: true,
        enable: ["stockAlert","salesAlert","invoiceAlert","paymentAlert","customerAlert","smsAlert","systemAlert","customAlert","list","markRead","delete","counter","filters","preferences"],
      },
    },
  },

  /* ============================================================
     PACKAGE 4 — PROFESSIONAL
     ============================================================ */
  {
    id: "professional",
    name: "Professional",
    badge: "প্রফেশনাল",
    description: "সিরিয়াস ব্যবসার জন্য — সীমাহীন ক্ষমতা।",
    icon: "Crown",
    color: "#8B5CF6",
    monthlyPrice: 2400,
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    active: true,
    order: 4,
    popular: false,

    limits: {
      productLimit:  { enabled: true, value: 10000,  unlimited: false },
      categoryLimit: { enabled: true, value: 2000,   unlimited: false },
      customerLimit: { enabled: true, value: 10000,  unlimited: false },
      userLimit:     { enabled: true, value: 25,     unlimited: false },
      invoiceLimit:  { enabled: true, value: 10000,  unlimited: false, period: "month" },
      smsLimit:      { enabled: true, value: 10000,  unlimited: false, period: "month" },
      reportLimit:   { enabled: true, value: 0,      unlimited: true,  period: "month" },
      stockLimit:    { enabled: true, value: 0,      unlimited: true },
      chatLimit:     { enabled: true, value: 0,      unlimited: true },
      imageLimit:    { enabled: true, value: 10,     unlimited: false },
      storage:       { enabled: true, value: 51200,  unlimited: false, unit: "MB" },
      fileUpload:    { enabled: true, value: 25,     unlimited: false, unit: "MB" },
    },

    pages: {
      dashboard: {
        access: true,
        enable: [
          "salesSummary","todaySales","todayExpense","stockSummary",
          "lowStockAlert","totalProducts","totalCustomers","recentInvoices",
          "incomeChart","profitLoss","advancedAnalytics","customDateRange","export",
        ],
      },
      product: {
        access: true,
        enable: [
          "add","edit","delete","search","sku","barcode","image","description",
          "supplier","purchasePrice","sellingPrice","variants","tags","import","export","bulkEdit",
        ],
        limits: { productLimit: { enabled: true, value: 10000, unlimited: false }, imageLimit: { enabled: true, value: 10, unlimited: false } },
      },
      category: {
        access: true,
        enable: ["add","edit","delete","search","image","banner","description","sorting","status","seo","hierarchy","productCount","bulk","import","export"],
        limits: { categoryLimit: { enabled: true, value: 2000, unlimited: false } },
      },
      stock: {
        access: true,
        enable: ["in","out","adjustment","transfer","history","valuation","lowAlert","forecasting","filter","dateFilter","export"],
        limits: { stockLimit: { enabled: true, value: 0, unlimited: true } },
      },
      stockDashboard: {
        access: true,
        enable: [
          "totalStock","lowStock","outOfStock","stockValue","productCount",
          "basicChart","advancedChart","fastMoving","slowMoving","deadStock",
          "turnover","categoryFilter","dateCompare","export",
        ],
      },
      income: {
        access: true,
        enable: ["add","edit","delete","category","source","notes","attachments","recurring","chart","dateFilter","analytics","export"],
      },
      report: {
        access: true,
        enable: ["sales","income","stock","customer","product","profit","supplier","daily","weekly","monthly","custom","pdf","xlsx"],
        limits: { reportLimit: { enabled: true, value: 0, unlimited: true, period: "month" } },
      },
      invoice: {
        access: true,
        enable: ["create","edit","delete","print","pdf","logo","templates","discount","tax","paymentStatus","share"],
        limits: { invoiceLimit: { enabled: true, value: 10000, unlimited: false, period: "month" } },
      },
      customer: {
        access: true,
        enable: ["add","edit","delete","search","photo","phone","email","address","history","balance","notes","groups","tags","emailMarketing","smsMarketing","export"],
        limits: { customerLimit: { enabled: true, value: 10000, unlimited: false } },
      },
      user: {
        access: true,
        enable: ["owner","profile","password","image","settings","staffInvite","roles","permissions","activity","loginHistory","status"],
        limits: { userLimit: { enabled: true, value: 25, unlimited: false } },
      },
      sms: {
        access: true,
        enable: ["send","history","templates","customSms","customerSms","bulk","schedule","delivery","balanceCheck","analytics","groups"],
        limits: { smsLimit: { enabled: true, value: 10000, unlimited: false, period: "month" } },
      },
      chat: {
        access: true,
        enable: ["enabled","customerChat","staffChat","groups","text","image","file","history","search","readStatus","onlineStatus","typing","notifications"],
        limits: { chatLimit: { enabled: true, value: 0, unlimited: true } },
      },
      notification: {
        access: true,
        enable: ["stockAlert","salesAlert","invoiceAlert","paymentAlert","customerAlert","smsAlert","systemAlert","customAlert","list","markRead","delete","counter","filters","preferences","automation"],
      },
    },
  },

  /* ============================================================
     PACKAGE 5 — ENTERPRISE
     ============================================================ */
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "এন্টারপ্রাইজ",
    description: "সবকিছু সীমাহীন — বৃহৎ প্রতিষ্ঠানের জন্য।",
    icon: "Gem",
    color: "#EF4444",
    monthlyPrice: 3000,
    yearlyDiscount: 15,
    fiveYearDiscount: 30,
    active: true,
    order: 5,
    popular: false,

    limits: {
      productLimit:  { enabled: true, value: 0, unlimited: true },
      categoryLimit: { enabled: true, value: 0, unlimited: true },
      customerLimit: { enabled: true, value: 0, unlimited: true },
      userLimit:     { enabled: true, value: 0, unlimited: true },
      invoiceLimit:  { enabled: true, value: 0, unlimited: true, period: "month" },
      smsLimit:      { enabled: true, value: 0, unlimited: true, period: "month" },
      reportLimit:   { enabled: true, value: 0, unlimited: true, period: "month" },
      stockLimit:    { enabled: true, value: 0, unlimited: true },
      chatLimit:     { enabled: true, value: 0, unlimited: true },
      imageLimit:    { enabled: true, value: 0, unlimited: true },
      storage:       { enabled: true, value: 0, unlimited: true, unit: "MB" },
      fileUpload:    { enabled: true, value: 0, unlimited: true, unit: "MB" },
    },

    pages: {
      dashboard: {
        access: true,
        enable: [
          "salesSummary","todaySales","todayExpense","stockSummary",
          "lowStockAlert","totalProducts","totalCustomers","recentInvoices",
          "incomeChart","profitLoss","advancedAnalytics","customDateRange","export",
        ],
      },
      product: {
        access: true,
        enable: [
          "add","edit","delete","search","sku","barcode","image","description",
          "supplier","purchasePrice","sellingPrice","variants","tags","import","export","bulkEdit",
        ],
      },
      category: {
        access: true,
        enable: ["add","edit","delete","search","image","banner","description","sorting","status","seo","hierarchy","productCount","bulk","import","export"],
      },
      stock: {
        access: true,
        enable: ["in","out","adjustment","transfer","history","valuation","lowAlert","forecasting","filter","dateFilter","export"],
      },
      stockDashboard: {
        access: true,
        enable: [
          "totalStock","lowStock","outOfStock","stockValue","productCount",
          "basicChart","advancedChart","fastMoving","slowMoving","deadStock",
          "turnover","categoryFilter","dateCompare","export",
        ],
      },
      income: {
        access: true,
        enable: ["add","edit","delete","category","source","notes","attachments","recurring","chart","dateFilter","analytics","export"],
      },
      report: {
        access: true,
        enable: ["sales","income","stock","customer","product","profit","supplier","daily","weekly","monthly","custom","pdf","xlsx"],
      },
      invoice: {
        access: true,
        enable: ["create","edit","delete","print","pdf","logo","templates","discount","tax","paymentStatus","share"],
      },
      customer: {
        access: true,
        enable: ["add","edit","delete","search","photo","phone","email","address","history","balance","notes","groups","tags","emailMarketing","smsMarketing","export"],
      },
      user: {
        access: true,
        enable: ["owner","profile","password","image","settings","staffInvite","roles","permissions","activity","loginHistory","status"],
      },
      sms: {
        access: true,
        enable: ["send","history","templates","customSms","customerSms","bulk","schedule","delivery","balanceCheck","analytics","groups"],
      },
      chat: {
        access: true,
        enable: ["enabled","customerChat","staffChat","groups","text","image","file","voice","history","search","readStatus","onlineStatus","typing","notifications"],
      },
      notification: {
        access: true,
        enable: ["stockAlert","salesAlert","invoiceAlert","paymentAlert","customerAlert","smsAlert","systemAlert","customAlert","list","markRead","delete","counter","filters","preferences","automation"],
      },
    },
  },
];

/**
 * Admin-এর জন্য — subscribe plan এর standard features name
 */
export const PLAN_ORDER = ["starter", "basic", "business", "professional", "enterprise"];

/**
 * একটি package এ কোনো feature enabled আছে কি না?
 */
export function isFeatureEnabled(pkg, pageId, featureId) {
  const page = pkg?.pages?.[pageId];
  if (!page || !page.access) return false;
  return !!page.features?.[featureId]?.enabled;
}

/**
 * একটি limit value বের করা
 */
export function getFeatureLimit(pkg, pageId, featureId) {
  const f = pkg?.pages?.[pageId]?.features?.[featureId];
  if (!f) return null;
  if (!f.enabled) return null;
  if (f.unlimited) return "unlimited";
  return Number(f.value) || 0;
}