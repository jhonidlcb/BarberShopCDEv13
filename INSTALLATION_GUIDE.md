
# 🏪 Barbershop System - Guía de Instalación VPS

## 📋 Análisis del Sistema

### **Funcionalidades Principales**

#### 🎯 **Sistema de Reservas**
- **Reserva de citas online** con calendario interactivo
- **Gestión de horarios** y disponibilidad
- **Múltiples franjas horarias** por día
- **Confirmación automática** de citas
- **Estados de citas**: Pendiente → Confirmada → Completada → Cancelada

#### 👥 **Gestión de Usuarios**
- **Admin Principal**: Control total del sistema
- **Empleados**: Dashboard para gestionar sus citas asignadas
- **Clientes**: Reserva de citas sin registro

#### 💰 **Sistema de Pagos y Estadísticas**
- **Múltiples monedas**: USD, Guaraníes (PYG), Reales (BRL)
- **Métodos de pago**: Efectivo, Tarjeta, Transferencia, Pix
- **Estadísticas detalladas** por empleado y período
- **Reportes de ingresos** y rendimiento

#### 🧑‍💼 **Panel Administrativo**
- **Gestión de servicios** y precios
- **Administración de empleados**
- **Configuración de horarios** de trabajo
- **Galería de imágenes** del negocio
- **Información de la empresa**
- **Sistema de reseñas**

#### 📱 **Características Técnicas**
- **Responsive Design** (móvil y desktop)
- **Multiidioma**: Español/Portugués
- **Base de datos PostgreSQL**
- **Autenticación JWT**
- **API RESTful**
- **Envío de emails** automático

---

## 🚀 Instalación en VPS

### **Prerrequisitos**

```bash
# Ubuntu/Debian - Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2 (Process Manager)
sudo npm install -g pm2

# Instalar Nginx (opcional para proxy)
sudo apt install nginx -y
```

### **Paso 1: Configurar Base de Datos**

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE barbershop_db;
CREATE USER barbershop_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE barbershop_db TO barbershop_user;
GRANT ALL ON SCHEMA public TO barbershop_user;
\q
```

### **Paso 2: Clonar y Configurar Proyecto**

```bash
# Crear directorio del proyecto
cd /opt
sudo mkdir barbershop
sudo chown $USER:$USER barbershop
cd barbershop

# Copiar archivos del proyecto (desde tu repositorio)
# git clone your-repository-url .

# O subir archivos manualmente
# scp -r ./proyecto/* user@your-vps-ip:/opt/barbershop/
```

### **Paso 3: Configurar Variables de Entorno**

```bash
# Crear archivo .env basado en .env.example
cp .env.example .env
nano .env
```

**Configurar el archivo `.env`:**
```bash
DATABASE_URL=postgresql://barbershop_user:your_secure_password@localhost:5432/barbershop_db
JWT_SECRET=tu_clave_jwt_super_segura_aqui
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-contraseña-de-aplicacion
NODE_ENV=production
PORT=5000
```

### **Paso 4: Instalar Dependencias**

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones de base de datos
npm run db:push

# Construir el proyecto
npm run build
```

### **Paso 5: Crear Usuario Admin Inicial**

```bash
# Ejecutar script de inicialización
node server/init-admin.ts
```

### **Paso 6: Configurar PM2**

```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'barbershop-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Crear directorio de logs
mkdir logs

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Paso 7: Configurar Nginx (Opcional)**

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/barbershop
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/barbershop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **Paso 8: Configurar SSL con Certbot (Opcional)**

```bash
# Instalar Certbot
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Crear certificado SSL
sudo certbot --nginx -d tu-dominio.com
```

### **Paso 9: Configurar Firewall**

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # Solo si no usas Nginx
sudo ufw enable
```

---

## 🔧 Configuración del Sistema

### **Configuración de Email (Gmail)**

1. Activar verificación en 2 pasos en Gmail
2. Generar contraseña de aplicación:
   - Google Account → Security → App passwords
   - Generar nueva contraseña para "Mail"
3. Usar esta contraseña en `GMAIL_PASS`

### **Generar JWT Secret Seguro**

```bash
# Generar clave JWT aleatoria
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Estructura del Sistema

### **Base de Datos (PostgreSQL)**
- `companies` - Información de la empresa
- `services` - Servicios disponibles
- `staff` - Personal/empleados
- `appointments` - Reservas/citas
- `employees` - Sistema de empleados con login
- `service_hours` - Horarios de trabajo
- `gallery` - Galería de imágenes
- `reviews` - Reseñas de clientes
- `currencies` - Monedas soportadas
- `employee_monthly_stats` - Estadísticas mensuales

### **API Endpoints Principales**
- `GET/POST /api/appointments` - Gestión de citas
- `GET/POST /api/services` - Servicios
- `GET/POST /api/staff` - Personal
- `POST /api/admin/login` - Login admin/empleado
- `GET /api/employee/*` - Dashboard empleado
- `GET/POST /api/admin/*` - Panel administrativo

---

## 🛡️ Seguridad

### **Medidas Implementadas**
- Autenticación JWT
- Hashing de contraseñas con bcrypt
- Validación de datos con Zod
- Rate limiting (implementar si es necesario)
- CORS configurado
- Variables de entorno para secrets

### **Recomendaciones Adicionales**
```bash
# Fail2ban para proteger SSH
sudo apt install fail2ban -y

# Configurar backup automático de BD
crontab -e
# Agregar: 0 2 * * * pg_dump barbershop_db | gzip > /backup/barbershop_$(date +\%Y\%m\%d).sql.gz
```

---

## 🚀 Comandos de Administración

### **PM2 Management**
```bash
pm2 status          # Ver estado
pm2 restart all     # Reiniciar
pm2 logs           # Ver logs
pm2 monit          # Monitor
pm2 reload all     # Reload sin downtime
```

### **Database Operations**
```bash
# Backup
pg_dump barbershop_db > backup.sql

# Restore
psql barbershop_db < backup.sql

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### **Nginx Operations**
```bash
sudo nginx -t                    # Test config
sudo systemctl restart nginx    # Restart
sudo systemctl status nginx     # Status
```

---

## 🎯 Acceso al Sistema

### **URLs de Acceso**
- **Frontend**: `http://tu-dominio.com`
- **Panel Admin**: `http://tu-dominio.com/admin/login`
- **Dashboard Empleado**: `http://tu-dominio.com/employee/dashboard`

### **Credenciales Iniciales**
- **Admin**: `admin` / `admin123`
- **Empleado**: Se crean desde el panel admin

---

## 🔍 Troubleshooting

### **Problemas Comunes**

1. **Error de conexión a BD**:
   ```bash
   # Verificar PostgreSQL
   sudo systemctl status postgresql
   sudo -u postgres psql -c "\l"
   ```

2. **Puerto ocupado**:
   ```bash
   # Ver qué usa el puerto 5000
   sudo lsof -i :5000
   ```

3. **Logs de aplicación**:
   ```bash
   pm2 logs barbershop-api
   ```

4. **Error de permisos**:
   ```bash
   # Ajustar permisos
   sudo chown -R $USER:$USER /opt/barbershop
   ```

---

## 📈 Monitoreo

### **Logs del Sistema**
```bash
# Logs de aplicación
tail -f /opt/barbershop/logs/combined.log

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log

# Logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### **Monitoreo de Recursos**
```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Estado de puertos
netstat -tulpn | grep LISTEN
```

---

## ✅ Checklist de Instalación

- [ ] ✅ Node.js 20.x instalado
- [ ] ✅ PostgreSQL configurado
- [ ] ✅ Base de datos creada
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Dependencias instaladas
- [ ] ✅ Proyecto construido
- [ ] ✅ Admin inicial creado
- [ ] ✅ PM2 configurado
- [ ] ✅ Nginx configurado (opcional)
- [ ] ✅ SSL configurado (opcional)
- [ ] ✅ Firewall configurado
- [ ] ✅ Backup configurado
- [ ] ✅ Sistema probado

---

🎉 **¡Sistema de Barbería instalado exitosamente!**

Para soporte adicional, verificar los logs y la documentación de cada componente.
