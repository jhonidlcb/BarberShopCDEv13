import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertAppointmentSchema,
  insertBlogPostSchema,
  insertReviewSchema,
  insertServiceSchema,
  insertGalleryImageSchema,
  insertCompanyInfoSchema,
  insertStaffMemberSchema,
  insertWorkingHoursSchema,
  insertEmployeeUserSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { adminSessions, services, adminUsers } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from "express";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || 'barbershop_jwt_secret_key_2024_' + Math.random().toString(36).substring(2, 15);
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET not found in environment. Using generated secret. Set JWT_SECRET in secrets for production.");
}
// TypeScript knows JWT_SECRET is not undefined after the check above

// Middleware to verify admin token
const verifyAdminToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const session = await storage.getAdminSession(token);
    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const adminUser = await storage.getAdminUser(session.userId);
    if (!adminUser || !adminUser.active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.adminUser = adminUser; // Attach user info to request
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// A simplified authenticateAdmin middleware for the new /api/admin/me route
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const session = await storage.getAdminSession(token);
    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach userId to the request for use in subsequent handlers
    req.userId = session.userId;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to verify employee token
const verifyEmployeeToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔐 Verificando token de empleado:', token ? 'TOKEN PRESENTE' : 'TOKEN AUSENTE');
    
    if (!token) {
      console.log('❌ Token requerido');
      return res.status(401).json({ error: "Token required" });
    }

    const session = await storage.getEmployeeSession(token);
    console.log('🔍 Sesión encontrada:', session ? 'SÍ' : 'NO');
    
    if (!session) {
      console.log('❌ Token inválido o expirado');
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const employee = await storage.getEmployeeUser(session.employeeId);
    console.log('👤 Empleado encontrado:', employee ? {
      id: employee.id,
      username: employee.username,
      active: employee.active,
      canLogin: employee.canLogin
    } : 'NO ENCONTRADO');
    
    if (!employee || !employee.active || !employee.canLogin) {
      console.log('❌ Empleado no encontrado o inactivo');
      return res.status(401).json({ error: "Employee not found or inactive" });
    }

    // Get staff member info if exists
    let staffMember = null;
    if (employee.staffMemberId) {
      const allStaff = await storage.getAllStaffMembers();
      staffMember = allStaff.find(s => s.id === employee.staffMemberId);
    }

    req.employee = { ...employee, staffMember };
    console.log('✅ Autenticación de empleado exitosa');
    next();
  } catch (error) {
    console.error("Employee auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};


// Configurar multer para uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Crear directorio uploads si no existe
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limite
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", {
      filename: file.originalname,
      mimetype: file.mimetype
    });

    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Servir archivos estáticos del directorio uploads
  app.use('/uploads', express.static(uploadDir));
  // Auth routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const adminUser = await storage.getAdminUserByUsername(username);
      if (!adminUser || !adminUser.active) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, adminUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: adminUser.id }, JWT_SECRET as string);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createAdminSession({
        userId: adminUser.id,
        token,
        expiresAt
      });

      res.json({
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", verifyAdminToken, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteAdminSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Check admin authentication
  app.get('/api/admin/me', verifyAdminToken, async (req: any, res) => {
    try {
      // req.adminUser is already populated by verifyAdminToken middleware
      const user = req.adminUser;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Upload de archivos
  app.post("/api/admin/upload", verifyAdminToken, upload.single('image'), async (req, res) => {
    try {
      console.log("Upload request received:", {
        hasFile: !!req.file,
        adminUser: (req as any).adminUser?.username
      });

      if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log("File uploaded successfully:", fileUrl);

      res.json({ 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Error al subir el archivo" });
    }
  });

  // Admin routes
  app.get("/api/admin/appointments", verifyAdminToken, async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching admin appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/admin/stats", verifyAdminToken, async (req, res) => {
    try {
      const stats = await storage.getAppointmentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.put("/api/admin/appointments/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.updateAppointment(id, req.body);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/admin/appointments/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAppointment(id);
      res.json({ message: "Appointment deleted" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.get("/api/admin/services", verifyAdminToken, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching admin services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.post("/api/admin/services", verifyAdminToken, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid service data", details: error.errors });
      } else {
        console.error("Error creating service:", error);
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  });

  app.put("/api/admin/services/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(id, req.body);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.json({ message: "Service deleted" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  app.get("/api/admin/gallery", verifyAdminToken, async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching admin gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  app.post("/api/admin/gallery", verifyAdminToken, async (req, res) => {
    try {
      const validatedData = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid gallery image data", details: error.errors });
      } else {
        console.error("Error creating gallery image:", error);
        res.status(500).json({ error: "Failed to create gallery image" });
      }
    }
  });

  app.put("/api/admin/gallery/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.updateGalleryImage(id, req.body);
      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ error: "Failed to update gallery image" });
    }
  });

  app.delete("/api/admin/gallery/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGalleryImage(id);
      res.json({ message: "Gallery image deleted" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ error: "Failed to delete gallery image" });
    }
  });

  app.get("/api/admin/blog", verifyAdminToken, async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.put("/api/admin/blog/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.updateBlogPost(id, req.body);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlogPost(id);
      res.json({ message: "Blog post deleted" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  app.get("/api/admin/reviews", verifyAdminToken, async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/admin/company", verifyAdminToken, async (req, res) => {
    try {
      const companyInfo = await storage.getCompanyInfo();
      res.json(companyInfo);
    } catch (error) {
      console.error("Error fetching admin company info:", error);
      res.status(500).json({ error: "Failed to fetch company info" });
    }
  });

  app.post("/api/admin/company", verifyAdminToken, async (req, res) => {
    try {
      const companyInfoArray = req.body;
      const results = [];

      for (const info of companyInfoArray) {
        const result = await storage.upsertCompanyInfo(info);
        results.push(result);
      }

      res.json(results);
    } catch (error) {
      console.error("Error updating company info:", error);
      res.status(500).json({ error: "Failed to update company info" });
    }
  });

  app.get("/api/admin/config", verifyAdminToken, async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching admin config:", error);
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.post("/api/admin/config", verifyAdminToken, async (req, res) => {
    try {
      await storage.updateSiteConfig(req.body);
      res.json({ message: "Config updated successfully" });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ error: "Failed to update config" });
    }
  });

  // Staff management routes
  app.get("/api/admin/staff", verifyAdminToken, async (req, res) => {
    try {
      const staff = await storage.getAllStaffMembers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching admin staff:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/admin/staff", verifyAdminToken, async (req, res) => {
    try {
      const validatedData = insertStaffMemberSchema.parse(req.body);
      const member = await storage.createStaffMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid staff member data", details: error.errors });
      } else {
        console.error("Error creating staff member:", error);
        res.status(500).json({ error: "Failed to create staff member" });
      }
    }
  });

  app.put("/api/admin/staff/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const member = await storage.updateStaffMember(id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating staff member:", error);
      res.status(500).json({ error: "Failed to update staff member" });
    }
  });

  app.delete("/api/admin/staff/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStaffMember(id);
      res.json({ message: "Staff member deleted" });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      res.status(500).json({ error: "Failed to delete staff member" });
    }
  });

  // Working hours management routes (business hours)
  app.get("/api/admin/working-hours", verifyAdminToken, async (req, res) => {
    try {
      const hours = await storage.getWorkingHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ error: "Failed to fetch working hours" });
    }
  });

  app.put("/api/admin/working-hours/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const hours = await storage.updateWorkingHours(id, req.body);
      if (!hours) {
        return res.status(404).json({ error: "Working hours not found" });
      }
      res.json(hours);
    } catch (error) {
      console.error("Error updating working hours:", error);
      res.status(500).json({ error: "Failed to update working hours" });
    }
  });

  // Service hours management routes (appointment booking hours)
  app.get("/api/admin/service-hours", verifyAdminToken, async (req, res) => {
    try {
      const hours = await storage.getServiceHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching service hours:", error);
      res.status(500).json({ error: "Failed to fetch service hours" });
    }
  });

  app.put("/api/admin/service-hours/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const hours = await storage.updateServiceHours(id, req.body);
      if (!hours) {
        return res.status(404).json({ error: "Service hours not found" });
      }
      res.json(hours);
    } catch (error) {
      console.error("Error updating service hours:", error);
      res.status(500).json({ error: "Failed to update service hours" });
    }
  });

  // Public routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      console.log(`Fetching appointments for date: ${date}`);
      const appointments = await storage.getAppointmentsByDate(date);
      
      // Get service hours configuration for slot limits
      const serviceHours = await storage.getServiceHours();
      const dayOfWeek = new Date(date).getDay();
      const dayConfig = serviceHours.find(sh => sh.dayOfWeek === dayOfWeek);
      const maxSlotsPerTime = dayConfig?.maxSlotsPerTime || 1;
      
      // Group appointments by time to check availability
      const appointmentsByTime = appointments.reduce((acc: any, apt: any) => {
        if (apt.status !== 'cancelled') {
          const time = apt.appointmentTime.substring(0, 5);
          acc[time] = (acc[time] || 0) + 1;
        }
        return acc;
      }, {});
      
      console.log(`Found ${appointments.length} appointments for ${date}:`, appointments.map(apt => ({
        id: apt.id,
        customerName: apt.customerName,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        status: apt.status
      })));
      
      console.log(`Slots config - Max slots per time: ${maxSlotsPerTime}, Appointments by time:`, appointmentsByTime);
      
      res.json({
        appointments,
        maxSlotsPerTime,
        appointmentsByTime
      });
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);

      // Send email notification to admin
      try {
        const siteConfig = await storage.getSiteConfig();
        const adminEmail = siteConfig?.site_email || 'admin@barberia.com';

        // Get service name
        const services = await storage.getServices();
        const service = services.find(s => s.id === appointment.serviceType);
        const serviceName = service?.name || appointment.serviceType;

        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('es-ES');

        // Create email transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER, // Set this in Replit Secrets
            pass: process.env.GMAIL_APP_PASSWORD // Set this in Replit Secrets (use App Password, not regular password)
          }
        });

        const emailContent = `
📅 NUEVA RESERVA RECIBIDA

Detalles de la reserva:
👤 Cliente: ${appointment.customerName}
📞 Teléfono: ${appointment.customerPhone}
${appointment.customerEmail ? `📧 Email: ${appointment.customerEmail}` : ''}
✂️ Servicio: ${serviceName}
📅 Fecha: ${appointmentDate}
🕐 Hora: ${appointment.appointmentTime}
${appointment.notes ? `📝 Notas: ${appointment.notes}` : ''}

Estado: Pendiente de confirmación

Para gestionar esta reserva, ingresa al panel de administración.
        `;

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: adminEmail,
          subject: `Nueva Reserva - ${appointment.customerName}`,
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>')
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('📧 Email notification sent successfully to:', adminEmail);

      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't fail the appointment creation if email fails
      }

      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid appointment data", details: error.errors });
      } else {
        console.error("Error creating appointment:", error);
        res.status(500).json({ error: "Failed to create appointment" });
      }
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, amountPaid, paymentCurrency, attendedByEmployeeId } = req.body;

      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Si el estado es 'completed', también actualizar el monto pagado y la moneda
      const updateData: any = { status };
      if (status === 'completed' && amountPaid !== undefined) {
        updateData.amountPaid = amountPaid;
        updateData.paymentCurrency = paymentCurrency || 'USD';
      }

      // Manejar asignación/desasignación de empleado
      if (attendedByEmployeeId !== undefined) {
        updateData.attendedByEmployeeId = attendedByEmployeeId;
      }

      const appointment = await storage.updateAppointment(id, updateData);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Update employee stats if appointment is completed
      if (status === 'completed' && attendedByEmployeeId) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        await storage.updateEmployeeStats(attendedByEmployeeId, currentMonth);
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Employee appointment status update (auto-assigns to logged employee)
  app.patch("/api/employee/appointments/:id/status", verifyEmployeeToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, amountPaid, paymentCurrency } = req.body;

      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Verificar que la cita aún esté disponible antes de actualizar
      const currentAppointment = await storage.getAppointmentById(id);
      if (!currentAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Si ya tiene un empleado asignado y no es el empleado actual, no permitir cambios
      if (currentAppointment.attendedByEmployeeId && 
          currentAppointment.attendedByEmployeeId !== req.employee.id &&
          (status === 'confirmed' || status === 'completed')) {
        return res.status(409).json({ 
          error: "Esta cita ya fue tomada por otro empleado",
          assignedEmployee: currentAppointment.attendedByEmployeeId 
        });
      }

      // Auto-assign to the logged employee when confirming or completing
      const updateData: any = { status };
      if (status === 'confirmed' || status === 'completed') {
        updateData.attendedByEmployeeId = req.employee.id;
      }

      if (status === 'completed' && amountPaid !== undefined) {
        updateData.amountPaid = amountPaid;
        updateData.paymentCurrency = paymentCurrency || 'USD';
      }

      const appointment = await storage.updateAppointment(id, updateData);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Update employee stats if appointment is completed
      if (status === 'completed') {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        await storage.updateEmployeeStats(req.employee.id, currentMonth);
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      const servicesList = await storage.getActiveServices();
      res.json(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getActiveGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const posts = await storage.getBlogPostsByCategory(category);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts by category:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPost(slug);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid blog post data", details: error.errors });
      } else {
        console.error("Error creating blog post:", error);
        res.status(500).json({ error: "Failed to create blog post" });
      }
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid review data", details: error.errors });
      } else {
        console.error("Error creating review:", error);
        res.status(500).json({ error: "Failed to create review" });
      }
    }
  });

  app.patch("/api/reviews/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.approveReview(id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error approving review:", error);
      res.status(500).json({ error: "Failed to approve review" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, phone, service, message } = req.body;

      if (!name || !phone || !message) {
        return res.status(400).json({ error: "Name, phone and message are required" });
      }

      // Send email notification to admin
      try {
        const siteConfig = await storage.getSiteConfig();
        const adminEmail = siteConfig?.site_email || 'admin@barberia.com';

        // Get service name if service ID is provided
        let serviceName = 'No especificado';
        if (service) {
          const services = await storage.getServices();
          const serviceObj = services.find(s => s.id === service);
          serviceName = serviceObj?.name || service;
        }

        // Create email transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          }
        });

        const emailContent = `
💬 NUEVO MENSAJE DE CONTACTO

Detalles del mensaje:
👤 Nombre: ${name}
📞 Teléfono: ${phone}
✂️ Servicio de interés: ${serviceName}

💬 Mensaje:
${message}

Este cliente será redirigido automáticamente a WhatsApp para continuar la conversación.
        `;

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: adminEmail,
          subject: `Nuevo Contacto - ${name}`,
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>')
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Contact email sent successfully to:', adminEmail);

      } catch (emailError) {
        console.error("Error sending contact email:", emailError);
        // Don't fail the contact form if email fails
      }

      console.log("Contact form submission:", { name, phone, service, message });
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  // Currency and language settings APIs
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencySettings();
      // Solo devolver monedas activas para el público
      const activeCurrencies = currencies.filter(c => c.isActive);
      res.json(activeCurrencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  // Admin currency management routes
  app.get("/api/admin/currencies", verifyAdminToken, async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencySettings();
      res.json(currencies);
    } catch (error) {
      console.error("Error fetching admin currencies:", error);
      res.status(500).json({ error: "Failed to fetch currencies" });
    }
  });

  app.put("/api/admin/currencies/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { exchangeRateToUsd } = req.body;

      if (!exchangeRateToUsd || exchangeRateToUsd <= 0) {
        return res.status(400).json({ error: "Valid exchange rate required" });
      }

      // Convertir el valor a número
      const rateValue = parseFloat(exchangeRateToUsd);

      const currency = await storage.updateCurrencySettings(parseInt(id), {
        exchangeRateToUsd: rateValue.toString()
      });

      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }

      res.json(currency);
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ error: "Failed to update currency" });
    }
  });

  // Employee Authentication routes
  app.post("/api/employee/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`🔑 Intento de login empleado - Usuario: ${username}`);

      if (!username || !password) {
        console.log("❌ Username o password faltante");
        return res.status(400).json({ error: "Username and password required" });
      }

      const employee = await storage.getEmployeeUserByUsername(username);
      console.log(`🔍 Empleado encontrado:`, employee ? {
        id: employee.id,
        username: employee.username,
        active: employee.active,
        canLogin: employee.can_login,
        hasPassword: !!employee.password
      } : 'NO ENCONTRADO');

      if (!employee) {
        console.log("❌ Empleado no existe");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!employee.active) {
        console.log("❌ Empleado inactivo");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!employee.canLogin && !employee.can_login) {
        console.log("❌ Empleado sin permisos de login");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, employee.password);
      console.log(`🔐 Validación de contraseña:`, isValidPassword ? 'VÁLIDA' : 'INVÁLIDA');

      if (!isValidPassword) {
        console.log("❌ Contraseña incorrecta");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ employeeId: employee.id }, JWT_SECRET as string);
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      await storage.createEmployeeSession({
        employeeId: employee.id,
        token,
        expiresAt
      });

      // Get staff member info if exists
      let staffMember = null;
      if (employee.staffMemberId) {
        const allStaff = await storage.getAllStaffMembers();
        staffMember = allStaff.find(s => s.id === employee.staffMemberId);
      }

      res.json({
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          email: employee.email,
          staffMember: staffMember
        }
      });
    } catch (error) {
      console.error("Employee login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/employee/logout", verifyEmployeeToken, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteEmployeeSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Employee logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get('/api/employee/me', verifyEmployeeToken, async (req: any, res) => {
    try {
      const employee = req.employee;
      res.json({
        id: employee.id,
        username: employee.username,
        email: employee.email,
        staffMember: employee.staffMember
      });
    } catch (error) {
      console.error('Employee auth check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Employee dashboard routes
  app.get("/api/employee/appointments", verifyEmployeeToken, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      // Obtener todas las citas disponibles (no solo las del empleado)
      const appointments = await storage.getAvailableAppointmentsForEmployees(
        startDate as string,
        endDate as string
      );
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching employee appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/employee/stats", verifyEmployeeToken, async (req: any, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      console.log(`📊 Solicitud de estadísticas para empleado ${req.employee.id}, mes ${currentMonth}`);
      
      // Force update of stats before returning them
      await storage.updateEmployeeStats(req.employee.id, currentMonth);
      
      // Get fresh stats
      const stats = await storage.getEmployeeStats(req.employee.id, currentMonth);
      console.log(`📊 Estadísticas devueltas:`, stats);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Admin Employee Management routes
  app.get("/api/admin/employees", verifyAdminToken, async (req, res) => {
    try {
      const employees = await storage.getAllEmployeeUsers();
      // Remove passwords from response
      const safeEmployees = employees.map((emp: any) => ({
        ...emp,
        password: undefined
      }));
      res.json(safeEmployees);
    } catch (error) {
      console.error("Error fetching admin employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/admin/employees", verifyAdminToken, async (req, res) => {
    try {
      const { staffMemberId, username, email, password, active, canLogin } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      // Check if username or email already exists
      const existingUser = await storage.getEmployeeUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const employeeData = {
        staffMemberId: staffMemberId === 'none' || !staffMemberId ? null : staffMemberId,
        username,
        email,
        password: hashedPassword,
        active: active !== false,
        canLogin: canLogin !== false
      };

      const newEmployee = await storage.createEmployeeUser(employeeData);
      // Remove password from response
      const { password: _, ...safeEmployee } = newEmployee;
      res.status(201).json(safeEmployee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.put("/api/admin/employees/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { staffMemberId, username, email, password, active, canLogin } = req.body;

      let updateData: any = {
        staffMemberId: staffMemberId === 'none' || !staffMemberId ? null : staffMemberId,
        username,
        email,
        active,
        canLogin: canLogin
      };

      // Only update password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      const employee = await storage.updateEmployeeUser(id, updateData);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Remove password from response
      const { password: _, ...safeEmployee } = employee;
      res.json(safeEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/admin/employees/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeUser(id);
      res.json({ message: "Employee deleted" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  app.get("/api/admin/employee-stats", verifyAdminToken, async (req, res) => {
    try {
      const stats = await storage.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin employee stats:", error);
      res.status(500).json({ error: "Failed to fetch employee statistics" });
    }
  });

  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getLanguageSettings();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  app.get("/api/languages/default", async (req, res) => {
    try {
      const defaultLanguage = await storage.getDefaultLanguage();
      res.json(defaultLanguage);
    } catch (error) {
      console.error("Error fetching default language:", error);
      res.status(500).json({ error: "Failed to fetch default language" });
    }
  });

  // Public site config endpoint (without authentication)
  app.get("/api/site-config", async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching public site config:", error);
      res.status(500).json({ error: "Failed to fetch site config" });
    }
  });

  // Public company info endpoint (without authentication)
  app.get("/api/company", async (req, res) => {
    try {
      const companyInfo = await storage.getCompanyInfo();
      res.json(companyInfo);
    } catch (error) {
      console.error("Error fetching public company info:", error);
      res.status(500).json({ error: "Failed to fetch company info" });
    }
  });

  // Public staff endpoint
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getActiveStaffMembers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Public employees endpoint for appointments
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployeeUsers();
      // Only return active employees who can login, without sensitive data
      const safeEmployees = employees
        .filter(emp => emp.active && emp.canLogin)
        .map(emp => ({
          id: emp.id,
          username: emp.username,
          staffMember: emp.staffMember
        }));
      res.json(safeEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Public working hours endpoint (business hours)
  app.get("/api/working-hours", async (req, res) => {
    try {
      const hours = await storage.getWorkingHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching working hours:", error);
      res.status(500).json({ error: "Failed to fetch working hours" });
    }
  });

  // Public service hours endpoint (appointment booking hours)
  app.get("/api/service-hours", async (req, res) => {
    try {
      const hours = await storage.getServiceHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching service hours:", error);
      res.status(500).json({ error: "Failed to fetch service hours" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}