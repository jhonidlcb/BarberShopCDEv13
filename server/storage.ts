import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, or, like } from "drizzle-orm";
import {
  users,
  appointments,
  blogPosts,
  reviews,
  services,
  galleryImages,
  companyInfo,
  siteConfig,
  adminUsers,
  adminSessions,
  currencySettings,
  languageSettings,
  staffMembers,
  workingHours,
  serviceHours,
  employeeUsers,
  employeeSessions,
  employeeStats,
  type User,
  type InsertUser,
  type Appointment,
  type InsertAppointment,
  type BlogPost,
  type InsertBlogPost,
  type Review,
  type InsertReview,
  type Service,
  type InsertService,
  type GalleryImage,
  type InsertGalleryImage,
  type CompanyInfo,
  type InsertCompanyInfo,
  type SiteConfig,
  type InsertSiteConfig,
  type AdminUser,
  type InsertAdminUser,
  type AdminSession,
  type InsertAdminSession,
  type CurrencySettings,
  type InsertCurrencySettings,
  type LanguageSettings,
  type InsertLanguageSettings,
  type StaffMember,
  type InsertStaffMember,
  type WorkingHours,
  type InsertWorkingHours,
  type ServiceHours,
  type InsertServiceHours,
  type InsertEmployeeUser,
  type InsertEmployeeSession,
  type EmployeeUser,
  type EmployeeSession
} from "@shared/schema";

// Verify DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Please configure it in Secrets.");
}

// Log the DATABASE_URL (without showing the full connection string for security)
console.log("🔌 Database URL configured:", process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET");
console.log("🔌 Connecting to Neon PostgreSQL...");

// Verify it's the correct Neon database
const expectedHost = "ep-still-term-acjgon5c-pooler.sa-east-1.aws.neon.tech";
const expectedUser = "neondb_owner";
const currentUrl = process.env.DATABASE_URL;

if (!currentUrl) {
  throw new Error("❌ DATABASE_URL not found in environment variables");
}

if (!currentUrl.includes(expectedHost)) {
  console.error("❌ DATABASE_URL is not pointing to the correct Neon database!");
  console.log("Expected host:", expectedHost);
  console.log("Current URL host:", currentUrl.split('@')[1]?.split('/')[0]);
  throw new Error("Database connection mismatch - check your DATABASE_URL in Secrets");
}

if (!currentUrl.includes(expectedUser)) {
  console.error("❌ DATABASE_URL is not using the correct database user!");
  console.log("Expected user:", expectedUser);
  throw new Error("Database user mismatch - check your DATABASE_URL in Secrets");
}

console.log("✅ Connected to correct Neon database:", expectedHost);
console.log("✅ Using correct database user:", expectedUser);

// Create Neon SQL connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle database instance
export const db = drizzle(sql, {
  schema: {
    users,
    appointments,
    blogPosts,
    reviews,
    siteConfig,
    services,
    galleryImages,
    companyInfo,
    adminUsers,
    adminSessions,
    currencySettings,
    languageSettings,
    staffMembers,
    workingHours,
    serviceHours,
    employeeUsers,
    employeeSessions,
    employeeStats
  }
});

// User operations
export const getUser = async (username: string) => {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
};

export const createUser = async (userData: InsertUser) => {
  const result = await db.insert(users).values(userData).returning();
  return result[0];
};

// Admin operations
export const getAdminUser = async (id: string) => {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return result[0];
};

export const getAdminUserByUsername = async (username: string) => {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  return result[0];
};

export const getAdminUserByEmail = async (email: string) => {
  const result = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return result[0];
};

export const createAdminUser = async (userData: InsertAdminUser) => {
  const result = await db.insert(adminUsers).values(userData).returning();
  return result[0];
};

export const createAdminSession = async (sessionData: InsertAdminSession) => {
  const result = await db.insert(adminSessions).values(sessionData).returning();
  return result[0];
};

export const getAdminSession = async (token: string) => {
  const result = await db.select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token))
    .orderBy(desc(adminSessions.expiresAt))
    .limit(1);

  // Check if session exists and is not expired
  if (result[0] && new Date() <= result[0].expiresAt) {
    return result[0];
  }
  return undefined;
};

export const deleteAdminSession = async (token: string) => {
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
};

// Appointments operations
export const getAppointments = async () => {
  return await db.select().from(appointments).orderBy(desc(appointments.createdAt));
};

export const getAppointmentsByDate = async (date: string) => {
  console.log(`Storage: Getting appointments for date ${date}`);
  const result = await db.select().from(appointments).where(eq(appointments.appointmentDate, date));
  console.log(`Storage: Found ${result.length} appointments:`, result.map(apt => ({
    id: apt.id,
    customerName: apt.customerName,
    appointmentTime: apt.appointmentTime,
    status: apt.status
  })));
  return result;
};

export const createAppointment = async (appointmentData: InsertAppointment) => {
  const result = await db.insert(appointments).values(appointmentData).returning();
  return result[0];
};

export const updateAppointment = async (id: string, appointmentData: Partial<InsertAppointment>) => {
  const result = await db.update(appointments)
    .set({ ...appointmentData })
    .where(eq(appointments.id, id))
    .returning();
  return result[0];
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const result = await db.update(appointments)
    .set({ status })
    .where(eq(appointments.id, id))
    .returning();
  return result[0];
};

export const deleteAppointment = async (id: string) => {
  await db.delete(appointments).where(eq(appointments.id, id));
};

// Services operations
export const getServices = async () => {
  return await db.select().from(services).orderBy(services.sortOrder);
};

export const getActiveServices = async () => {
  return await db.select().from(services)
    .where(eq(services.active, true))
    .orderBy(services.sortOrder);
};

export const createService = async (serviceData: InsertService) => {
  const result = await db.insert(services).values(serviceData).returning();
  return result[0];
};

export const updateService = async (id: string, serviceData: Partial<InsertService>) => {
  const result = await db.update(services)
    .set({ ...serviceData, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  return result[0];
};

export const deleteService = async (id: string) => {
  await db.delete(services).where(eq(services.id, id));
};

// Reviews operations
export const getApprovedReviews = async () => {
  return await db.select().from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt));
};

export const getReviews = async () => {
  return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
};

export const createReview = async (reviewData: InsertReview) => {
  const result = await db.insert(reviews).values(reviewData).returning();
  return result[0];
};

export const updateReview = async (id: string, reviewData: Partial<InsertReview>) => {
  const result = await db.update(reviews)
    .set(reviewData)
    .where(eq(reviews.id, id))
    .returning();
  return result[0];
};

export const approveReview = async (id: string) => {
  const result = await db.update(reviews)
    .set({ approved: true })
    .where(eq(reviews.id, id))
    .returning();
  return result[0];
};

export const deleteReview = async (id: string) => {
  await db.delete(reviews).where(eq(reviews.id, id));
};

// Gallery operations
export const getActiveGalleryImages = async () => {
  return await db.select().from(galleryImages)
    .where(eq(galleryImages.active, true))
    .orderBy(galleryImages.sortOrder);
};

export const getGalleryImages = async () => {
  return await db.select().from(galleryImages).orderBy(galleryImages.sortOrder);
};

export const createGalleryImage = async (imageData: InsertGalleryImage) => {
  const result = await db.insert(galleryImages).values(imageData).returning();
  return result[0];
};

export const updateGalleryImage = async (id: string, imageData: Partial<InsertGalleryImage>) => {
  const result = await db.update(galleryImages)
    .set(imageData)
    .where(eq(galleryImages.id, id))
    .returning();
  return result[0];
};

export const deleteGalleryImage = async (id: string) => {
  await db.delete(galleryImages).where(eq(galleryImages.id, id));
};

// Blog operations
export const getPublishedBlogPosts = async () => {
  return await db.select().from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.createdAt));
};

export const getBlogPosts = async () => {
  return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
};

export const getBlogPost = async (slug: string) => {
  const result = await db.select().from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return result[0];
};

export const getBlogPostsByCategory = async (category: string) => {
  return await db.select().from(blogPosts)
    .where(and(
      eq(blogPosts.category, category),
      eq(blogPosts.published, true)
    ))
    .orderBy(desc(blogPosts.createdAt));
};

export const createBlogPost = async (postData: InsertBlogPost) => {
  const result = await db.insert(blogPosts).values(postData).returning();
  return result[0];
};

export const updateBlogPost = async (id: string, postData: Partial<InsertBlogPost>) => {
  const result = await db.update(blogPosts)
    .set({ ...postData, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return result[0];
};

export const deleteBlogPost = async (id: string) => {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
};

// Company info operations
export const getCompanyInfo = async () => {
  return await db.select().from(companyInfo).orderBy(companyInfo.section);
};

export const getCompanyInfoBySection = async (section: string) => {
  const result = await db.select().from(companyInfo)
    .where(eq(companyInfo.section, section))
    .limit(1);
  return result[0];
};

export const upsertCompanyInfo = async (infoData: any) => {
  const existing = await getCompanyInfoBySection(infoData.section);

  const updateData = {
    section: infoData.section,
    title: infoData.title || null,
    titlePt: infoData.titlePt || null,
    content: infoData.content || null,
    contentPt: infoData.contentPt || null,
    content2: infoData.content2 || null,
    content2Pt: infoData.content2Pt || null,
    imageUrl: infoData.imageUrl || null,
    barberName: infoData.barberName || null,
    barberTitle: infoData.barberTitle || null,
    barberTitlePt: infoData.barberTitlePt || null,
    yearsExperience: infoData.yearsExperience || null,
    totalClients: infoData.totalClients || null,
    satisfaction: infoData.satisfaction || null,
    metadata: infoData.metadata || null,
    updatedAt: new Date()
  };

  if (existing) {
    const result = await db
      .update(companyInfo)
      .set(updateData)
      .where(eq(companyInfo.section, infoData.section))
      .returning();
    return result[0];
  } else {
    const insertData = {
      ...updateData,
      createdAt: new Date()
    };
    const result = await db
      .insert(companyInfo)
      .values(insertData)
      .returning();
    return result[0];
  }
};

// Site config operations
export const getSiteConfig = async () => {
  const result = await db.select().from(siteConfig).orderBy(siteConfig.key);
  return result.reduce((acc, config) => {
    acc[config.key] = config.value;
    return acc;
  }, {} as Record<string, string>);
};

export const getSiteConfigByKey = async (key: string) => {
  const result = await db.select().from(siteConfig)
    .where(eq(siteConfig.key, key))
    .limit(1);
  return result[0];
};

export const updateSiteConfig = async (configData: Record<string, string>) => {
  const results = [];

  for (const [key, value] of Object.entries(configData)) {
    const existing = await getSiteConfigByKey(key);

    if (existing) {
      const result = await db.update(siteConfig)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteConfig.key, key))
        .returning();
      results.push(result[0]);
    } else {
      const result = await db.insert(siteConfig)
        .values({ key, value })
        .returning();
      results.push(result[0]);
    }
  }

  return results;
};

export const createSiteConfig = async (configData: InsertSiteConfig) => {
  const result = await db.insert(siteConfig).values(configData).returning();
  return result[0];
};

// Currency settings operations
export const getCurrencySettings = async () => {
  return await db.select().from(currencySettings).where(eq(currencySettings.isActive, true));
};

export const getAllCurrencySettings = async () => {
  return await db.select().from(currencySettings);
};

export const updateCurrencySettings = async (id: number, data: Partial<InsertCurrencySettings>) => {
  const result = await db.update(currencySettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(currencySettings.id, id))
    .returning();
  return result[0];
};

// Language settings operations
export const getLanguageSettings = async () => {
  return await db.select().from(languageSettings).where(eq(languageSettings.isActive, true));
};

export const getAllLanguageSettings = async () => {
  return await db.select().from(languageSettings);
};

export const getDefaultLanguage = async () => {
  const result = await db.select().from(languageSettings).where(eq(languageSettings.isDefault, true)).limit(1);
  return result[0];
};

export const updateLanguageSettings = async (id: number, data: Partial<InsertLanguageSettings>) => {
  const result = await db.update(languageSettings)
    .set(data)
    .where(eq(languageSettings.id, id))
    .returning();
  return result[0];
};

// Test database connection
export const testConnection = async () => {
  try {
    await db.select().from(users).limit(1);
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Staff operations
export const getActiveStaffMembers = async () => {
  return await db.select().from(staffMembers)
    .where(eq(staffMembers.active, true))
    .orderBy(staffMembers.sortOrder);
};

export const getAllStaffMembers = async () => {
  return await db.select().from(staffMembers).orderBy(staffMembers.sortOrder);
};

export const createStaffMember = async (memberData: InsertStaffMember) => {
  const result = await db.insert(staffMembers).values(memberData).returning();
  return result[0];
};

export const updateStaffMember = async (id: string, memberData: Partial<InsertStaffMember>) => {
  const result = await db.update(staffMembers)
    .set({ ...memberData, updatedAt: new Date() })
    .where(eq(staffMembers.id, id))
    .returning();
  return result[0];
};

export const deleteStaffMember = async (id: string) => {
  await db.delete(staffMembers).where(eq(staffMembers.id, id));
};

// Working hours operations (business hours)
export const getWorkingHours = async () => {
  return await db.select().from(workingHours)
    .where(eq(workingHours.active, true))
    .orderBy(workingHours.dayOfWeek);
};

export const updateWorkingHours = async (id: string, hoursData: Partial<InsertWorkingHours>) => {
  // Remove updatedAt from hoursData if it exists and ensure it's properly set
  const { updatedAt, ...cleanHoursData } = hoursData as any;

  const result = await db.update(workingHours)
    .set({
      ...cleanHoursData,
      updatedAt: new Date()
    })
    .where(eq(workingHours.id, id))
    .returning();
  return result[0];
};

export const getWorkingHoursByDay = async (dayOfWeek: number) => {
  const result = await db.select().from(workingHours)
    .where(and(eq(workingHours.dayOfWeek, dayOfWeek), eq(workingHours.active, true)))
    .limit(1);
  return result[0];
};

// Service hours operations (appointment booking hours)
export const getServiceHours = async () => {
  return await db.select().from(serviceHours)
    .where(eq(serviceHours.active, true))
    .orderBy(serviceHours.dayOfWeek);
};

export const updateServiceHours = async (id: string, hoursData: Partial<InsertServiceHours>) => {
  // Remove all timestamp fields from hoursData and ensure they're properly set
  const { updatedAt, createdAt, ...cleanHoursData } = hoursData;

  const result = await db.update(serviceHours)
    .set({
      ...cleanHoursData,
      updatedAt: new Date()
    })
    .where(eq(serviceHours.id, id))
    .returning();
  return result[0];
};

export const getServiceHoursByDay = async (dayOfWeek: number) => {
  const result = await db.select().from(serviceHours)
    .where(and(eq(serviceHours.dayOfWeek, dayOfWeek), eq(serviceHours.active, true)))
    .limit(1);
  return result[0];
};

// Employee operations
export const getAllEmployeeUsers = async () => {
  const result = await db.select({
    id: employeeUsers.id,
    staffMemberId: employeeUsers.staffMemberId,
    username: employeeUsers.username,
    email: employeeUsers.email,
    active: employeeUsers.active,
    canLogin: employeeUsers.canLogin,
    createdAt: employeeUsers.createdAt,
    updatedAt: employeeUsers.updatedAt,
    // Staff member fields separately to handle nulls
    staffMemberId_join: staffMembers.id,
    staffMemberName: staffMembers.name,
    staffMemberPosition: staffMembers.position,
    staffMemberActive: staffMembers.active
  })
  .from(employeeUsers)
  .leftJoin(staffMembers, eq(employeeUsers.staffMemberId, staffMembers.id))
  .orderBy(employeeUsers.createdAt);
  
  return result.map(emp => ({
    id: emp.id,
    staffMemberId: emp.staffMemberId,
    username: emp.username,
    email: emp.email,
    active: emp.active,
    canLogin: emp.canLogin,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
    staffMember: emp.staffMemberId ? {
      id: emp.staffMemberId_join || emp.staffMemberId,
      name: emp.staffMemberName || 'Miembro no encontrado',
      position: emp.staffMemberPosition || 'Posición no definida',
      active: emp.staffMemberActive || false
    } : null
  }));
};

export const getEmployeeUser = async (id: string) => {
  const result = await db.select().from(employeeUsers).where(eq(employeeUsers.id, id)).limit(1);
  return result[0];
};

export const getEmployeeUserByUsername = async (username: string) => {
  console.log(`🔍 Buscando empleado con username: ${username}`);
  const result = await db.select().from(employeeUsers).where(eq(employeeUsers.username, username)).limit(1);
  console.log(`🔍 Resultado de búsqueda:`, result[0] ? 'Empleado encontrado' : 'Empleado NO encontrado');
  if (result[0]) {
    // Fix the can_login field mapping
    return {
      ...result[0],
      can_login: result[0].canLogin
    };
  }
  return result[0];
};

export const createEmployeeUser = async (userData: InsertEmployeeUser) => {
  const result = await db.insert(employeeUsers).values(userData).returning();
  return result[0];
};

export const updateEmployeeUser = async (id: string, userData: Partial<InsertEmployeeUser>) => {
  const result = await db.update(employeeUsers)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(employeeUsers.id, id))
    .returning();
  return result[0];
};

export const deleteEmployeeUser = async (id: string) => {
  await db.delete(employeeUsers).where(eq(employeeUsers.id, id));
};

export const createEmployeeSession = async (sessionData: InsertEmployeeSession) => {
  // Fix field mapping for employee_id vs employeeId
  const mappedData = {
    employee_id: sessionData.employeeId,
    token: sessionData.token,
    expires_at: sessionData.expiresAt
  };
  const result = await db.insert(employeeSessions).values(mappedData as any).returning();
  return result[0];
};

export const getEmployeeSession = async (token: string) => {
  const result = await db.select()
    .from(employeeSessions)
    .where(eq(employeeSessions.token, token))
    .orderBy(desc(employeeSessions.expires_at))
    .limit(1);

  if (result[0] && new Date() <= result[0].expires_at) {
    // Map the database fields to the expected format
    return {
      ...result[0],
      employeeId: result[0].employee_id,
      expiresAt: result[0].expires_at
    };
  }
  return undefined;
};

export const deleteEmployeeSession = async (token: string) => {
  await db.delete(employeeSessions).where(eq(employeeSessions.token, token));
};

// Statistics operations for employees
export const getEmployeeStats = async (employeeId?: string, monthYear?: string) => {
  if (employeeId && monthYear) {
    // Get stats for specific employee and month
    console.log(`📊 Obteniendo estadísticas para empleado ${employeeId}, mes ${monthYear}`);
    const result = await db.select().from(employeeStats)
      .where(and(eq(employeeStats.employee_id, employeeId), eq(employeeStats.month_year, monthYear)))
      .limit(1);
    
    console.log(`📊 Estadísticas encontradas:`, result[0]);
    
    // If no stats found, return default structure
    if (!result[0]) {
      console.log(`📊 No se encontraron estadísticas, devolviendo valores por defecto`);
      return {
        employeeId: employeeId,
        monthYear: monthYear,
        totalAppointments: 0,
        completedAppointments: 0,
        totalRevenue: "0.00"
      };
    }
    
    // Map database fields to expected format
    return {
      employeeId: result[0].employee_id,
      monthYear: result[0].month_year,
      totalAppointments: result[0].total_appointments || 0,
      completedAppointments: result[0].completed_appointments || 0,
      totalRevenue: result[0].total_revenue || "0.00",
      revenueByCurrency: result[0].revenue_by_currency ? JSON.parse(result[0].revenue_by_currency as string) : {}
    };
  } else {
    // Get all employee stats with employee details
    const result = await db.select({
      employeeId: employeeStats.employee_id,
      monthYear: employeeStats.month_year,
      totalAppointments: employeeStats.total_appointments,
      completedAppointments: employeeStats.completed_appointments,
      totalRevenue: employeeStats.total_revenue,
      employeeName: staffMembers.name,
      employeeUsername: employeeUsers.username
    })
    .from(employeeStats)
    .leftJoin(employeeUsers, eq(employeeStats.employee_id, employeeUsers.id))
    .leftJoin(staffMembers, eq(employeeUsers.staffMemberId, staffMembers.id))
    .orderBy(employeeStats.month_year, employeeStats.employee_id);
    
    return result;
  }
};

export const updateEmployeeStats = async (employeeId: string, monthYear: string) => {
  try {
    console.log(`📊 Actualizando estadísticas para empleado ${employeeId}, mes ${monthYear}`);
    
    // Get appointments for this employee in this month
    const startOfMonth = `${monthYear}-01`;
    const year = parseInt(monthYear.split('-')[0]);
    const month = parseInt(monthYear.split('-')[1]);
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];
    
    console.log(`📅 Rango de fechas: ${startOfMonth} a ${endOfMonth}`);
    
    // Get all appointments for the employee using proper date filtering
    const employeeAppointments = await db.select({
      id: appointments.id,
      status: appointments.status,
      amountPaid: appointments.amountPaid,
      paymentCurrency: appointments.paymentCurrency,
      appointmentDate: appointments.appointmentDate,
      serviceType: appointments.serviceType
    })
      .from(appointments)
      .where(and(
        eq(appointments.attendedByEmployeeId, employeeId),
        sql`appointment_date >= ${startOfMonth}`,
        sql`appointment_date <= ${endOfMonth}`
      ));

    console.log(`📋 Citas encontradas para el empleado: ${employeeAppointments.length}`);
    console.log(`📋 Detalles de las citas:`, employeeAppointments.map(apt => ({
      id: apt.id,
      date: apt.appointmentDate,
      status: apt.status,
      amountPaid: apt.amountPaid,
      currency: apt.paymentCurrency
    })));

    const totalAppointments = employeeAppointments.length;
    const completedAppointments = employeeAppointments.filter(apt => apt.status === 'completed').length;
    
    // Calculate revenue by currency
    const revenueByCurrency = employeeAppointments
      .filter(apt => apt.status === 'completed' && apt.amountPaid)
      .reduce((acc, apt) => {
        const currency = apt.paymentCurrency || 'USD';
        const amount = Number(apt.amountPaid || 0);
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

    console.log(`💰 Ingresos por moneda:`, revenueByCurrency);

    // Get currency settings for conversion to USD
    const currencyList = await db.select({
      currencyCode: currencySettings.currencyCode,
      exchangeRateToUsd: currencySettings.exchangeRateToUsd
    }).from(currencySettings);
    const exchangeRates = currencyList.reduce((rates, setting) => {
      if (setting.currencyCode === 'USD') {
        rates[setting.currencyCode] = 1;
      } else {
        const rate = parseFloat(setting.exchangeRateToUsd.toString());
        rates[setting.currencyCode] = 1 / rate; // Convert to USD rate
      }
      return rates;
    }, {} as Record<string, number>);

    // Calculate total revenue in USD equivalent
    const totalRevenueUSD = Object.entries(revenueByCurrency).reduce((total, [currency, amount]) => {
      const rate = exchangeRates[currency] || (currency === 'USD' ? 1 : 0);
      const convertedAmount = amount * rate;
      console.log(`💱 ${currency} ${amount} -> USD ${convertedAmount.toFixed(2)} (rate: ${rate})`);
      return total + convertedAmount;
    }, 0);

    console.log(`📊 Estadísticas calculadas:`, {
      totalAppointments,
      completedAppointments,
      revenueByCurrency,
      totalRevenueUSD: totalRevenueUSD.toFixed(2)
    });

    const statsData = {
      employee_id: employeeId,
      month_year: monthYear,
      total_appointments: totalAppointments,
      completed_appointments: completedAppointments,
      total_revenue: totalRevenueUSD.toFixed(2),
      revenue_by_currency: JSON.stringify(revenueByCurrency),
      updated_at: new Date()
    };

    // Check if stats already exist
    const existing = await getEmployeeStats(employeeId, monthYear);
    console.log(`📊 Estadísticas existentes:`, existing ? 'SÍ' : 'NO');

    if (existing) {
      const result = await db
        .update(employeeStats)
        .set(statsData)
        .where(and(eq(employeeStats.employee_id, employeeId), eq(employeeStats.month_year, monthYear)))
        .returning();
      console.log(`✅ Estadísticas actualizadas:`, result[0]);
      return result[0];
    } else {
      const insertData = {
        ...statsData,
        created_at: new Date()
      };
      const result = await db
        .insert(employeeStats)
        .values(insertData)
        .returning();
      console.log(`✅ Estadísticas creadas:`, result[0]);
      return result[0];
    }
  } catch (error) {
    console.error('Error updating employee stats:', error);
    throw error;
  }
};

export const getEmployeeAppointments = async (employeeId: string, startDate?: string, endDate?: string) => {
  let query = db.select().from(appointments).where(eq(appointments.attendedByEmployeeId, employeeId));
  
  if (startDate && endDate) {
    query = query.where(and(
      eq(appointments.attendedByEmployeeId, employeeId),
      sql`appointment_date >= ${startDate}`,
      sql`appointment_date <= ${endDate}`
    ));
  }
  
  const result = await query.orderBy(desc(appointments.appointmentDate));
  return result;
};

// Función para obtener todas las citas disponibles para empleados
export const getAvailableAppointmentsForEmployees = async (startDate?: string, endDate?: string) => {
  let query = db.select().from(appointments).where(
    or(
      eq(appointments.status, 'pending'),    // Citas pendientes
      eq(appointments.status, 'confirmed'),  // Citas confirmadas
      eq(appointments.status, 'completed')   // Citas completadas (para ver historial)
    )
  );
  
  if (startDate && endDate) {
    query = query.where(and(
      or(
        eq(appointments.status, 'pending'),
        eq(appointments.status, 'confirmed'),
        eq(appointments.status, 'completed')
      ),
      sql`appointment_date >= ${startDate}`,
      sql`appointment_date <= ${endDate}`
    ));
  }
  
  const result = await query.orderBy(desc(appointments.appointmentDate), appointments.appointmentTime);
  return result;
};

// Función para obtener una cita por ID
export const getAppointmentById = async (id: string) => {
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
};

// Statistics operations
export const getAppointmentStats = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Previous month for comparison
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all appointments for calculations
    const allAppointments = await db.select({
      id: appointments.id,
      status: appointments.status,
      appointmentDate: appointments.appointmentDate,
      appointmentTime: appointments.appointmentTime,
      serviceType: appointments.serviceType,
      amountPaid: appointments.amountPaid,
      paymentCurrency: appointments.paymentCurrency
    }).from(appointments);
    const servicesList = await db.select({
      id: services.id,
      name: services.name,
      priceUsd: services.priceUsd,
      priceBrl: services.priceBrl,
      pricePyg: services.pricePyg
    }).from(services);

    // Current month stats
    const thisMonthAppointments = allAppointments.filter(apt =>
      new Date(apt.appointmentDate) >= startOfMonth
    );

    // Previous month stats
    const prevMonthAppointments = allAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= startOfPrevMonth && aptDate <= endOfPrevMonth;
    });

    // This week stats
    const thisWeekAppointments = allAppointments.filter(apt =>
      new Date(apt.appointmentDate) >= startOfWeek
    );

    // Today stats
    const todayAppointments = allAppointments.filter(apt =>
      new Date(apt.appointmentDate) >= startOfToday
    );

    // Calculate revenue by currency for current month
    const monthlyRevenueByCurrency = thisMonthAppointments.reduce((totals, apt) => {
      if (apt.status === 'completed') {
        const currency = apt.paymentCurrency || 'USD';

        if (!totals[currency]) {
          totals[currency] = 0;
        }

        // Usar amount_paid si está disponible, sino usar el precio del servicio
        if (apt.amountPaid) {
          totals[currency] += Number(apt.amountPaid);
        } else {
          const service = servicesList.find(s => s.id === apt.serviceType);
          const servicePrice = currency === 'USD' ? service?.priceUsd :
                              currency === 'BRL' ? service?.priceBrl :
                              currency === 'PYG' ? service?.pricePyg :
                              service?.priceUsd || 0;
          totals[currency] += Number(servicePrice || 0);
        }
      }
      return totals;
    }, {} as Record<string, number>);

    // Calculate revenue by currency for previous month
    const prevMonthRevenueByCurrency = prevMonthAppointments.reduce((totals, apt) => {
      if (apt.status === 'completed') {
        const currency = apt.paymentCurrency || 'USD';

        if (!totals[currency]) {
          totals[currency] = 0;
        }

        // Usar amount_paid si está disponible, sino usar el precio del servicio
        if (apt.amountPaid) {
          totals[currency] += Number(apt.amountPaid);
        } else {
          const service = servicesList.find(s => s.id === apt.serviceType);
          const servicePrice = currency === 'USD' ? service?.priceUsd :
                              currency === 'BRL' ? service?.priceBrl :
                              currency === 'PYG' ? service?.pricePyg :
                              service?.priceUsd || 0;
          totals[currency] += Number(servicePrice || 0);
        }
      }
      return totals;
    }, {} as Record<string, number>);

    // Get current exchange rates from database
    const currencyList = await db.select({
      currencyCode: currencySettings.currencyCode,
      exchangeRateToUsd: currencySettings.exchangeRateToUsd
    }).from(currencySettings);
    const exchangeRates = currencyList.reduce((rates, setting) => {
      if (setting.currencyCode === 'USD') {
        rates[setting.currencyCode] = 1;
      } else {
        // Convert to USD: divide by the exchange rate (use precise decimal calculation)
        const rate = parseFloat(setting.exchangeRateToUsd.toString());
        rates[setting.currencyCode] = 1 / rate;
      }
      return rates;
    }, {} as Record<string, number>);

    // Calculate total revenue in USD equivalent for comparison
    const monthlyRevenue = Object.entries(monthlyRevenueByCurrency).reduce((total, [currency, amount]) => {
      const rate = exchangeRates[currency] || (currency === 'USD' ? 1 : 0);
      const convertedAmount = parseFloat((amount * rate).toFixed(4)); // Mantener 4 decimales para precisión
      return total + convertedAmount;
    }, 0);

    const prevMonthRevenue = Object.entries(prevMonthRevenueByCurrency).reduce((total, [currency, amount]) => {
      const rate = exchangeRates[currency] || (currency === 'USD' ? 1 : 0);
      const convertedAmount = parseFloat((amount * rate).toFixed(4)); // Mantener 4 decimales para precisión
      return total + convertedAmount;
    }, 0);

    // Status distribution
    const statusStats = {
      pending: allAppointments.filter(apt => apt.status === 'pending').length,
      confirmed: allAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: allAppointments.filter(apt => apt.status === 'completed').length,
      cancelled: allAppointments.filter(apt => apt.status === 'cancelled').length,
    };

    // Popular services
    const serviceStats: Record<string, number> = {};
    thisMonthAppointments.forEach(apt => {
      if (apt.serviceType) {
        serviceStats[apt.serviceType] = (serviceStats[apt.serviceType] || 0) + 1;
      }
    });

    const popularServices = Object.entries(serviceStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([serviceId, count]) => {
        const service = servicesList.find(s => s.id === serviceId);
        return {
          id: serviceId,
          name: service?.name || 'Servicio desconocido',
          count: count
        };
      });

    // Weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = allAppointments.filter(apt =>
        apt.appointmentDate === dateStr
      ).length;
      weeklyTrend.push({
        date: dateStr,
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        appointments: dayAppointments
      });
    }

    // Hourly distribution (most busy hours)
    const hourlyStats: Record<string, number> = {};
    thisMonthAppointments.forEach(apt => {
      const hour = apt.appointmentTime.split(':')[0];
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    const busyHours = Object.entries(hourlyStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        appointments: count
      }));

    return {
      // Current period stats
      totalThisMonth: thisMonthAppointments.length,
      totalThisWeek: thisWeekAppointments.length,
      totalToday: todayAppointments.length,
      monthlyRevenue: monthlyRevenue,

      // Comparison with previous month
      totalPrevMonth: prevMonthAppointments.length,
      prevMonthRevenue: prevMonthRevenue,
      monthlyRevenueByCurrency: monthlyRevenueByCurrency,
      prevMonthRevenueByCurrency: prevMonthRevenueByCurrency,
      monthGrowth: prevMonthAppointments.length > 0
        ? ((thisMonthAppointments.length - prevMonthAppointments.length) / prevMonthAppointments.length * 100)
        : 0,
      revenueGrowth: prevMonthRevenue > 0
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue * 100)
        : 0,

      // Status distribution
      statusStats,

      // Popular services
      popularServices,

      // Trends
      weeklyTrend,
      busyHours,

      // Additional metrics
      completionRate: thisMonthAppointments.length > 0
        ? (thisMonthAppointments.filter(apt => apt.status === 'completed').length / thisMonthAppointments.length * 100)
        : 0,

      averageDaily: thisMonthAppointments.length > 0
        ? (thisMonthAppointments.length / new Date().getDate())
        : 0
    };

  } catch (error) {
    console.error('Error getting appointment stats:', error);
    throw error;
  }
};

// Export storage object for compatibility
export const storage = {
  // User operations
  getUser,
  createUser,

  // Admin operations
  getAdminUser,
  getAdminUserByUsername,
  getAdminUserByEmail,
  createAdminUser,
  createAdminSession,
  getAdminSession,
  deleteAdminSession,

  // Appointments
  getAppointments,
  getAppointmentsByDate,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,

  // Services
  getServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,

  // Reviews
  getApprovedReviews,
  getReviews,
  createReview,
  updateReview,
  approveReview,
  deleteReview,

  // Gallery
  getActiveGalleryImages,
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,

  // Blog
  getPublishedBlogPosts,
  getBlogPosts,
  getBlogPost,
  getBlogPostsByCategory,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,

  // Company info
  getCompanyInfo,
  getCompanyInfoBySection,
  upsertCompanyInfo,

  // Site config
  getSiteConfig,
  getSiteConfigByKey,
  updateSiteConfig,
  createSiteConfig,

  // Currency settings
  getCurrencySettings,
  getAllCurrencySettings,
  updateCurrencySettings,

  // Language settings
  getLanguageSettings,
  getAllLanguageSettings,
  getDefaultLanguage,
  updateLanguageSettings,

  // Staff operations
  getActiveStaffMembers,
  getAllStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,

  // Working hours
  getWorkingHours,
  updateWorkingHours,
  getWorkingHoursByDay,

  // Service hours
  getServiceHours,
  updateServiceHours,
  getServiceHoursByDay,

  // Employee operations
  getAllEmployeeUsers,
  getEmployeeUser,
  getEmployeeUserByUsername,
  createEmployeeUser,
  updateEmployeeUser,
  deleteEmployeeUser,
  createEmployeeSession,
  getEmployeeSession,
  deleteEmployeeSession,

  // Employee statistics
  getEmployeeStats,
  updateEmployeeStats,
  getEmployeeAppointments,
  getAvailableAppointmentsForEmployees,
  getAppointmentById,

  // Statistics
  getAppointmentStats,

  // Test
  testConnection
};