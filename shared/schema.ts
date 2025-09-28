import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, date, time, unique, check, numeric, jsonb, serial, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  serviceType: text("service_type").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: time("appointment_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  paymentCurrency: varchar("payment_currency", { length: 3 }).default("USD"),
  attendedByEmployeeId: varchar("attended_by_employee_id").references(() => employeeUsers.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueSlot: unique().on(table.appointmentDate, table.appointmentTime),
  statusCheck: check("status_check", sql`status IN ('pending', 'confirmed', 'completed', 'cancelled')`)
}));

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  titlePt: text("title_pt"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  contentPt: text("content_pt"),
  excerpt: text("excerpt").notNull(),
  excerptEs: text("excerpt_es"),
  excerptPt: text("excerpt_pt"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  categoryCheck: check("category_check", sql`category IN ('hair-care', 'beard-care', 'styling-tips')`)
}));

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  serviceType: text("service_type"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  ratingCheck: check("rating_check", sql`rating >= 1 AND rating <= 5`)
}));

export const siteConfig = pgTable("site_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  namePt: text("name_pt").notNull(),
  description: text("description").notNull(),
  descriptionEs: text("description_es"),
  descriptionPt: text("description_pt").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  priceBrl: numeric("price_brl", { precision: 10, scale: 2 }),
  pricePyg: numeric("price_pyg", { precision: 12, scale: 0 }),
  isPopular: boolean("is_popular").default(false),
  durationMinutes: integer("duration_minutes").notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  titleEs: text("title_es"),
  titlePt: text("title_pt"),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionPt: text("description_pt"),
  category: text("category").default("general"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const companyInfo = pgTable("company_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull().unique(),
  title: text("title"),
  titlePt: text("title_pt"),
  content: text("content"),
  contentEs: text("content_es"),
  contentPt: text("content_pt"),
  content2: text("content2"),
  content2Pt: text("content2_pt"),
  imageUrl: text("image_url"),
  barberName: text("barber_name"),
  barberTitle: text("barber_title"),
  barberTitlePt: text("barber_title_pt"),
  yearsExperience: text("years_experience"),
  totalClients: text("total_clients"),
  satisfaction: text("satisfaction"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// New tables for multilingual/multicurrency support
export const currencySettings = pgTable("currency_settings", {
  id: serial("id").primaryKey(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().unique(),
  currencyName: varchar("currency_name", { length: 50 }).notNull(),
  currencySymbol: varchar("currency_symbol", { length: 10 }).notNull(),
  exchangeRateToUsd: numeric("exchange_rate_to_usd", { precision: 15, scale: 6 }).default('1.0'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const languageSettings = pgTable("language_settings", {
  id: serial("id").primaryKey(),
  languageCode: varchar("language_code", { length: 2 }).notNull().unique(),
  languageName: varchar("language_name", { length: 50 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(["hair-care", "beard-care", "styling-tips"]),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  approved: true,
}).extend({
  rating: z.number().min(1).max(5),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyInfoSchema = createInsertSchema(companyInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export type InsertCompanyInfo = z.infer<typeof insertCompanyInfoSchema>;
export type CompanyInfo = typeof companyInfo.$inferSelect;

export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  positionEs: text("position_es"),
  positionPt: text("position_pt").notNull(),
  description: text("description"),
  descriptionEs: text("description_es"),
  descriptionPt: text("description_pt"),
  imageUrl: text("image_url"),
  yearsExperience: integer("years_experience").default(0),
  specialties: text("specialties"),
  specialtiesEs: text("specialties_es"),
  specialtiesPt: text("specialties_pt"),
  socialInstagram: text("social_instagram"),
  socialFacebook: text("social_facebook"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const workingHours = pgTable("working_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull(),
  dayName: text("day_name").notNull(),
  dayNameEs: text("day_name_es"),
  dayNamePt: text("day_name_pt").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  openTime: time("open_time"),
  closeTime: time("close_time"),
  breakStartTime: time("break_start_time"),
  breakEndTime: time("break_end_time"),
  slotDurationMinutes: integer("slot_duration_minutes").default(30),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  dayOfWeekCheck: check("day_of_week_check", sql`day_of_week >= 0 AND day_of_week <= 6`)
}));

// New types for multilingual/multicurrency support
export const insertCurrencySettingsSchema = createInsertSchema(currencySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLanguageSettingsSchema = createInsertSchema(languageSettings).omit({
  id: true,
  createdAt: true,
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkingHoursSchema = createInsertSchema(workingHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCurrencySettings = z.infer<typeof insertCurrencySettingsSchema>;
export type CurrencySettings = typeof currencySettings.$inferSelect;

export type InsertLanguageSettings = z.infer<typeof insertLanguageSettingsSchema>;
export type LanguageSettings = typeof languageSettings.$inferSelect;

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;

export type InsertWorkingHours = z.infer<typeof insertWorkingHoursSchema>;
export type WorkingHours = typeof workingHours.$inferSelect;

export type InsertServiceHours = z.infer<typeof insertServiceHoursSchema>;
export type ServiceHours = typeof serviceHours.$inferSelect;

export type InsertEmployeeUser = z.infer<typeof insertEmployeeUserSchema>;
export type EmployeeUser = typeof employeeUsers.$inferSelect;

export type InsertEmployeeSession = z.infer<typeof insertEmployeeSessionSchema>;
export type EmployeeSession = typeof employeeSessions.$inferSelect;

export type InsertEmployeeStats = z.infer<typeof insertEmployeeStatsSchema>;
export type EmployeeStats = typeof employeeStats.$inferSelect;

// Service Hours (for appointment booking)
export const serviceHours = pgTable("service_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayOfWeek: integer("day_of_week").notNull(),
  dayName: varchar("day_name", { length: 20 }).notNull(),
  dayNameEs: varchar("day_name_es", { length: 20 }),
  dayNamePt: varchar("day_name_pt", { length: 20 }).notNull(),
  isAvailable: boolean("is_available").default(true),
  startTime: time("start_time"),
  endTime: time("end_time"),
  breakStartTime: time("break_start_time"),
  breakEndTime: time("break_end_time"),
  slotDurationMinutes: integer("slot_duration_minutes").default(30),
  availableSlots: jsonb("available_slots"),
  maxSlotsPerTime: integer("max_slots_per_time").default(1),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertServiceHoursSchema = createInsertSchema(serviceHours);

// New employee tables
export const employeeUsers = pgTable("employee_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffMemberId: varchar("staff_member_id").references(() => staffMembers.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  active: boolean("active").notNull().default(true),
  canLogin: boolean("can_login").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const employeeSessions = pgTable("employee_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employee_id: varchar("employee_id").notNull().references(() => employeeUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
});

export const employeeStats = pgTable("employee_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employee_id: varchar("employee_id").notNull().references(() => employeeUsers.id, { onDelete: "cascade" }),
  month_year: varchar("month_year", { length: 7 }).notNull(), // Format: YYYY-MM
  total_appointments: integer("total_appointments").default(0),
  completed_appointments: integer("completed_appointments").default(0),
  total_revenue: numeric("total_revenue", { precision: 12, scale: 2 }).default('0.00'),
  revenue_by_currency: jsonb("revenue_by_currency"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_at: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  employeeMonthUnique: unique("employee_stats_employee_id_month_year_unique").on(table.employee_id, table.month_year),
}));

// Insert schemas for new employee tables
export const insertEmployeeUserSchema = createInsertSchema(employeeUsers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEmployeeSessionSchema = createInsertSchema(employeeSessions).omit({
  id: true,
  created_at: true,
}).extend({
  employeeId: z.string().optional(),
  expiresAt: z.date().optional()
});

export const insertEmployeeStatsSchema = createInsertSchema(employeeStats).omit({
  id: true,
  created_at: true,
  updated_at: true,
});