import {
  pgTable,
  text,
  uuid,
  serial,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Account Table ---
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: real("balance").notNull().default(0),
  accountNumber: text("account_number").notNull(),
  institutionName: text("institution_name").notNull(),
  institutionLogo: text("institution_logo"),
  plaidAccessToken: text("plaid_access_token"),
  plaidItemId: text("plaid_item_id"),
  isConnected: boolean("is_connected").notNull().default(false),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  userId: true,
  name: true,
  type: true,
  balance: true,
  accountNumber: true,
  institutionName: true,
  institutionLogo: true,
  plaidAccessToken: true,
  plaidItemId: true,
  isConnected: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// --- Transactions Table ---
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  category: text("category"),
  isIncome: boolean("is_income").notNull().default(false),
  plaidTransactionId: text("plaid_transaction_id"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  accountId: true,
  amount: true,
  description: true,
  date: true,
  category: true,
  isIncome: true,
  plaidTransactionId: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// --- Budget Categories Table ---
export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  limit: real("limit").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).pick({
  userId: true,
  name: true,
  limit: true,
  color: true,
  icon: true,
});
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

// --- Transfers Table ---
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  amount: real("amount").notNull(),
  date: timestamp("date").notNull(),
  note: text("note"),
  status: text("status").notNull(),
  plaidTransferId: text("plaid_transfer_id"),
});

export const insertTransferSchema = createInsertSchema(transfers).pick({
  fromAccountId: true,
  toAccountId: true,
  amount: true,
  date: true,
  note: true,
  status: true,
  plaidTransferId: true,
});
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfers.$inferSelect;

// --- Plaid API Schemas ---
export const plaidLinkTokenSchema = z.object({
  link_token: z.string(),
});
export type PlaidLinkToken = z.infer<typeof plaidLinkTokenSchema>;

export const plaidExchangeSchema = z.object({
  publicToken: z.string(),
});
export type PlaidExchange = z.infer<typeof plaidExchangeSchema>;
