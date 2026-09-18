import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  phone: text("phone"),
  // Roles: 'admin' | 'finance' | 'office' | 'courier' | 'seller' | 'pending'
  role: text("role").default("pending").notNull(),
  // For office staff and branch couriers assigned to a specific office
  officeId: text("office_id").references(() => offices.id, { onDelete: "set null" }),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ==========================================
// 2. OFFICES & SYSTEM SETTINGS
// ==========================================

export const offices = pgTable("offices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(), // e.g. "Tirana Central Office"
  code: text("code").unique().notNull(), // e.g. "TIR-01"
  city: text("city").notNull(), // e.g. "Tirana"
  address: text("address"),
  phone: text("phone"),
  // Percentage commission taken by this intake office from the total postal tariff
  intakeCommissionPercent: numeric("intake_commission_percent", { precision: 5, scale: 2 })
    .default("15.00")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().default("default"),
  // Total postal tariff per package in ALL (assigned by Admin)
  totalTariffPerPackage: numeric("total_tariff_per_package", { precision: 10, scale: 2 })
    .default("300.00")
    .notNull(),
  // Fixed cut or commission for the destination/delivery office in ALL (assigned by Admin)
  deliveryOfficeCut: numeric("delivery_office_cut", { precision: 10, scale: 2 })
    .default("100.00")
    .notNull(),
  currency: text("currency").default("ALL").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 3. PACKAGES & AUDIT EVENTS
// ==========================================

export const packages = pgTable("packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  barcode: text("barcode").unique().notNull(), // e.g. "PF-948201"
  sellerId: text("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  intakeOfficeId: text("intake_office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "restrict" }),
  destinationOfficeId: text("destination_office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "restrict" }),
  // Payment Type: 'cod' (Cash on Delivery) | 'prepaid'
  paymentType: text("payment_type").default("cod").notNull(),
  // COD amount to collect from recipient in ALL (0 if prepaid)
  amount: numeric("amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  // Client details
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientAddress: text("client_address").notNull(),
  clientCity: text("client_city"),
  notes: text("notes"),
  // Status flow:
  // created -> accepted_at_intake -> bagged -> in_transit_interoffice ->
  // received_at_dest_office -> out_for_delivery -> delivered | refused
  status: text("status").default("created").notNull(),
  assignedCourierId: text("assigned_courier_id").references(() => users.id, { onDelete: "set null" }),
  deliveredAt: timestamp("delivered_at"),
  refusedReason: text("refused_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const packageEvents = pgTable("package_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  officeId: text("office_id").references(() => offices.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 4. BAGS & MANIFESTS (INTER-OFFICE TRANSIT)
// ==========================================

export const bags = pgTable("bags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  barcode: text("barcode").unique().notNull(), // e.g. "BAG-8291"
  originOfficeId: text("origin_office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "restrict" }),
  destinationOfficeId: text("destination_office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "restrict" }),
  // Status: 'open' | 'sealed' | 'assigned' | 'in_transit' | 'received' | 'unloaded'
  status: text("status").default("open").notNull(),
  assignedCourierId: text("assigned_courier_id").references(() => users.id, { onDelete: "set null" }),
  sealedAt: timestamp("sealed_at"),
  dispatchedAt: timestamp("dispatched_at"),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bagPackages = pgTable("bag_packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bagId: text("bag_id")
    .notNull()
    .references(() => bags.id, { onDelete: "cascade" }),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

// ==========================================
// 5. CASH FLOW, OFFICE CLOSING & TRANSIT TO FINANCE
// ==========================================

export const officeClosings = pgTable("office_closings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  closingCode: text("closing_code").unique().notNull(), // e.g. "CLS-20260918-001"
  officeId: text("office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "restrict" }),
  closedById: text("closed_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  closingDate: timestamp("closing_date").defaultNow().notNull(),
  totalCodCollected: numeric("total_cod_collected", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  packageCount: integer("package_count").default(0).notNull(),
  // Status: 'closed' | 'in_transit_to_finance' | 'received_by_finance'
  status: text("status").default("closed").notNull(),
  courierId: text("courier_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cashTransits = pgTable("cash_transits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  closingId: text("closing_id")
    .notNull()
    .references(() => officeClosings.id, { onDelete: "cascade" }),
  courierId: text("courier_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  // Status: 'assigned' | 'in_transit' | 'received_by_finance'
  status: text("status").default("assigned").notNull(),
  handedOverAt: timestamp("handed_over_at"),
  receivedAt: timestamp("received_at"),
  receivedById: text("received_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 6. FINANCIAL PAYOUTS & COMMISSIONS
// ==========================================

export const financialPayouts = pgTable("financial_payouts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  payoutBatchCode: text("payout_batch_code"),
  sellerId: text("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  codAmount: numeric("cod_amount", { precision: 10, scale: 2 }).notNull(),
  postalTariff: numeric("postal_tariff", { precision: 10, scale: 2 }).notNull(),
  intakeOfficeCommission: numeric("intake_office_commission", { precision: 10, scale: 2 }).notNull(),
  deliveryOfficeCut: numeric("delivery_office_cut", { precision: 10, scale: 2 }).notNull(),
  // Seller Payout = COD Amount - Postal Tariff
  sellerPayoutAmount: numeric("seller_payout_amount", { precision: 10, scale: 2 }).notNull(),
  // Status: 'pending' | 'cleared' | 'paid'
  status: text("status").default("pending").notNull(),
  paymentReference: text("payment_reference"),
  clearedAt: timestamp("cleared_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
