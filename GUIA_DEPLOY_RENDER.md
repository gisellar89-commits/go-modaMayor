# 🚀 Guía de Deploy en Render - go-modaMayor

## Deploy Simplificado con Render (PaaS)

**Versión**: 1.0  
**Fecha**: 26 de diciembre de 2025  
**Tiempo estimado**: 1-2 horas  
**Nivel**: Principiante-Intermedio

---

## 📋 ¿Qué es Render?

Render es una plataforma PaaS (Platform as a Service) que simplifica el deployment:
- ✅ **No necesitás configurar servidores** (sin SSH, sin Linux)
- ✅ **Deploy automático** desde GitHub
- ✅ **SSL gratis** y automático
- ✅ **Base de datos administrada** (backups incluidos)
- ✅ **Escalado fácil** desde la interfaz
- ✅ **Logs y monitoreo** integrados

---

## 💰 Costos Render

### Plan Free (Para probar - 90 días)
```
✅ Backend Web Service:   Gratis (con cold starts*)
✅ Frontend Static Site:  Gratis
✅ PostgreSQL:            Gratis 90 días
Total:                    $0 USD/mes

*Cold start: Si no hay tráfico por 15 min, el servicio se "duerme".
La primera request después tarda 30-60 segundos en despertar.
```

### Plan Producción (Recomendado)
```
Backend Web Service:      $7 USD/mes (sin cold starts)
Frontend Static Site:     $0 USD/mes (gratis)
PostgreSQL 1GB:           $7 USD/mes
Total:                    $14 USD/mes
```

### Plan Performance
```
Backend Web Service:      $25 USD/mes (2GB RAM)
Frontend Static Site:     $0 USD/mes
PostgreSQL 4GB:           $25 USD/mes
Total:                    $50 USD/mes
```

---

## 📦 Lo que necesitás antes de empezar

- ✅ Cuenta de GitHub (gratis)
- ✅ Tu proyecto go-modaMayor funcionando localmente
- ✅ Git instalado
- ✅ Tarjeta de crédito/débito (para plan pago, después del free trial)

---

## 🎯 Índice

1. [Preparar el Proyecto](#1-preparar-el-proyecto)
2. [Subir a GitHub](#2-subir-a-github)
3. [Crear Cuenta en Render](#3-crear-cuenta-en-render)
4. [Deploy de PostgreSQL](#4-deploy-de-postgresql)
5. [Deploy del Backend](#5-deploy-del-backend)
6. [Deploy del Frontend](#6-deploy-del-frontend)
7. [Aplicar Migraciones](#7-aplicar-migraciones)
8. [Configurar Dominio](#8-configurar-dominio)
9. [Verificar Todo Funciona](#9-verificar-todo-funciona)
10. [Actualizaciones](#10-actualizaciones)
11. [Monitoreo y Logs](#11-monitoreo-y-logs)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Preparar el Proyecto

### 1.1. Crear archivo `.gitignore`

Asegurate de tener un `.gitignore` en la raíz del proyecto:

```bash
# Crear/editar .gitignore
vim .gitignore
```

Contenido:
```gitignore
# Binarios compilados
modamayor-server
*.exe
*.exe~
*.dll
*.so
*.dylib

# Environment variables
.env
.env.local
.env.production

# Archivos temporales
*.log
*.swp
*.swo
*~

# Frontend
front/node_modules/
front/.next/
front/out/
front/build/
front/.DS_Store
front/npm-debug.log*

# Backend
vendor/
uploads/*
!uploads/.gitkeep

# IDEs
.vscode/
.idea/
*.iml

# OS
.DS_Store
Thumbs.db
```

### 1.2. Crear archivo para preservar carpeta uploads

```bash
# Crear archivo vacío para que Git preserve la carpeta
touch uploads/.gitkeep
```

### 1.3. Crear `render.yaml` (Configuración de servicios)

Este archivo le dice a Render cómo desplegar tu aplicación:

```bash
# Crear en la raíz del proyecto
vim render.yaml
```

Contenido:
```yaml
services:
  # Backend Go API
  - type: web
    name: modamayor-backend
    runtime: go
    buildCommand: go build -o bin/server cmd/main.go
    startCommand: ./bin/server
    envVars:
      - key: PORT
        value: 8080
      - key: GIN_MODE
        value: release
      - key: DATABASE_URL
        fromDatabase:
          name: modamayor-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
        sync: false
      - key: ALLOWED_ORIGINS
        value: https://modamayor.com,https://www.modamayor.com
    healthCheckPath: /health
    autoDeploy: true

  # Frontend Next.js
  - type: web
    name: modamayor-frontend
    runtime: node
    buildCommand: cd front && npm ci && npm run build
    startCommand: cd front && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_API_URL
        value: https://modamayor-backend.onrender.com
    autoDeploy: true

# Base de datos PostgreSQL
databases:
  - name: modamayor-db
    databaseName: modamayor
    user: modamayor
    plan: free
```

### 1.4. Modificar código para usar DATABASE_URL

Render provee la conexión a PostgreSQL como una variable `DATABASE_URL`.

Editar `config/database.go`:

```bash
vim config/database.go
```

Agregar al inicio (después de los imports):

```go
import (
    "fmt"
    "log"
    "os"
    "net/url"
    "strings"
    
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
    var dsn string
    
    // Render provee DATABASE_URL
    databaseURL := os.Getenv("DATABASE_URL")
    
    if databaseURL != "" {
        // Usar DATABASE_URL de Render
        dsn = databaseURL
    } else {
        // Desarrollo local: usar variables individuales
        host := os.Getenv("DB_HOST")
        if host == "" {
            host = "localhost"
        }
        
        port := os.Getenv("DB_PORT")
        if port == "" {
            port = "5432"
        }
        
        user := os.Getenv("DB_USER")
        if user == "" {
            user = "gisellaromano"
        }
        
        password := os.Getenv("DB_PASSWORD")
        if password == "" {
            password = "8765abcd"
        }
        
        dbname := os.Getenv("DB_NAME")
        if dbname == "" {
            dbname = "modamayor"
        }
        
        dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
            host, user, password, dbname, port)
    }
    
    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    log.Println("Database connected successfully!")
}
```

### 1.5. Agregar endpoint de health check

Editar `routes/router.go` y agregar:

```go
// Health check para Render
router.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{
        "status": "ok",
        "service": "modamayor-backend",
    })
})
```

### 1.6. Configurar puerto dinámico en el backend

Render asigna el puerto dinámicamente. Editar `cmd/main.go`:

```go
func main() {
    // Cargar variables de entorno
    godotenv.Load()
    
    // Conectar base de datos
    config.ConnectDatabase()
    
    // Setup router
    r := routes.SetupRouter()
    
    // Obtener puerto (Render lo provee en PORT)
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    // Iniciar servidor
    log.Printf("Server starting on port %s", port)
    r.Run(":" + port)
}
```

### 1.7. Verificar `package.json` del frontend

Asegurate de que `front/package.json` tenga los scripts correctos:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 1.8. Crear `.env.example` (documentación)

```bash
vim .env.example
```

Contenido:
```env
# Base de datos (desarrollo local)
DB_HOST=localhost
DB_PORT=5432
DB_USER=gisellaromano
DB_PASSWORD=8765abcd
DB_NAME=modamayor

# O usar DATABASE_URL (producción Render)
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=tu_secret_super_seguro_aqui

# Server
PORT=8080
GIN_MODE=release

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 2. Subir a GitHub

### 2.1. Inicializar Git (si no lo hiciste)

```bash
cd /Users/gisellaromano/Documents/go-modaMayor

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit - ready for Render deploy"
```

### 2.2. Crear repositorio en GitHub

**Opción A: Desde la terminal (si tenés GitHub CLI)**

```bash
# Instalar GitHub CLI si no lo tenés
brew install gh

# Login
gh auth login

# Crear repo privado
gh repo create go-modaMayor --private --source=. --push
```

**Opción B: Desde la web**

1. Ir a https://github.com/new
2. Nombre: `go-modaMayor`
3. Privado: ✅ Seleccionado
4. Click "Create repository"
5. Copiar los comandos que aparecen:

```bash
git remote add origin https://github.com/TU_USUARIO/go-modaMayor.git
git branch -M main
git push -u origin main
```

### 2.3. Verificar que todo se subió

```bash
# Ver remoto
git remote -v

# Ver último commit
git log -1
```

Ir a tu repo en GitHub y verificar que estén todos los archivos.

---

## 3. Crear Cuenta en Render

### 3.1. Registrarse

1. Ir a https://render.com/
2. Click "Get Started"
3. **Sign Up with GitHub** (recomendado - más fácil)
4. Autorizar Render a acceder a tus repos
5. Verificar email

### 3.2. Configurar Billing (para plan pago después)

1. Dashboard → Settings → Billing
2. Agregar tarjeta (no te cobran en el free tier)
3. Confirmar

**Nota**: El free tier es gratis por 90 días. Después necesitás migrar a plan pago o el servicio se suspende.

---

## 4. Deploy de PostgreSQL

### 4.1. Crear Base de Datos

1. En Render Dashboard → "New +" (arriba derecha)
2. Seleccionar **"PostgreSQL"**
3. Configurar:
   - **Name**: `modamayor-db`
   - **Database**: `modamayor`
   - **User**: `modamayor`
   - **Region**: Oregon (us-west) o Ohio (us-east-2)
   - **Plan**: **Free** (para empezar)
4. Click "Create Database"

### 4.2. Esperar que se cree

- Tarda 2-3 minutos
- Cuando esté lista, el estado cambia a "Available"

### 4.3. Anotar credenciales

En la página de la DB, verás:
- **Internal Database URL**: Para conectar desde servicios en Render
- **External Database URL**: Para conectar desde tu máquina local

Copiar el **External Database URL**, se ve así:
```
postgresql://modamayor:XXXXXXXXX@dpg-xxxxx.oregon-postgres.render.com/modamayor
```

Lo vas a necesitar para aplicar migraciones.

---

## 5. Deploy del Backend

### 5.1. Crear Web Service

1. Dashboard → "New +" → **"Web Service"**
2. "Connect a repository" → Buscar `go-modaMayor`
3. Click "Connect"

### 5.2. Configurar Servicio

- **Name**: `modamayor-backend`
- **Region**: Mismo que la DB (Oregon o Ohio)
- **Branch**: `main`
- **Runtime**: **Go**
- **Build Command**: `go build -o bin/server cmd/main.go`
- **Start Command**: `./bin/server`
- **Plan**: **Free** (para empezar)

### 5.3. Variables de Entorno

Scroll down a "Environment Variables":

Click "Add Environment Variable" para cada una:

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `GIN_MODE` | `release` |
| `JWT_SECRET` | `[Generate]` (click en "Generate Value") |
| `ALLOWED_ORIGINS` | `https://modamayor-frontend.onrender.com` (después lo cambiamos al dominio real) |

**DATABASE_URL**: Click "Add from Database" → Seleccionar `modamayor-db`

### 5.4. Health Check

- **Health Check Path**: `/health`

### 5.5. Deploy!

- Click "Create Web Service"
- Render comienza a hacer el deploy (5-10 minutos)

### 5.6. Ver logs

En la página del servicio, click en "Logs" para ver el progreso:

```
Building...
Installing Go dependencies...
Building binary...
Build completed successfully
Starting service...
Server starting on port 8080
Database connected successfully!
```

### 5.7. Anotar la URL

Cuando termine, verás la URL de tu backend:
```
https://modamayor-backend.onrender.com
```

Probar: https://modamayor-backend.onrender.com/health

Debe responder:
```json
{
  "status": "ok",
  "service": "modamayor-backend"
}
```

✅ **Backend desplegado!**

---

## 6. Deploy del Frontend

### 6.1. Crear Web Service para Frontend

1. Dashboard → "New +" → **"Web Service"**
2. Seleccionar el mismo repo `go-modaMayor`
3. Click "Connect"

### 6.2. Configurar Servicio

- **Name**: `modamayor-frontend`
- **Region**: Mismo que backend
- **Branch**: `main`
- **Runtime**: **Node**
- **Build Command**: `cd front && npm ci && npm run build`
- **Start Command**: `cd front && npm start`
- **Plan**: **Free**

### 6.3. Variables de Entorno

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://modamayor-backend.onrender.com` |

### 6.4. Deploy Frontend

- Click "Create Web Service"
- Esperar 5-10 minutos

### 6.5. Ver logs

Debe mostrar:
```
Installing dependencies...
Building Next.js app...
Build completed
Starting Next.js server...
Ready on http://0.0.0.0:3000
```

### 6.6. Anotar URL del Frontend

```
https://modamayor-frontend.onrender.com
```

### 6.7. Actualizar CORS en el Backend

Ahora que tenés la URL del frontend, actualizarla en el backend:

1. Ir a `modamayor-backend` service → Environment
2. Editar `ALLOWED_ORIGINS`:
   ```
   https://modamayor-frontend.onrender.com
   ```
3. Save changes → Esto hará un re-deploy automático

✅ **Frontend desplegado!**

---

## 7. Aplicar Migraciones

### 7.1. Desde tu máquina local

Necesitás la URL externa de la base de datos (la que anotaste antes).

```bash
# Ir a la carpeta del proyecto
cd /Users/gisellaromano/Documents/go-modaMayor

# Aplicar migraciones en orden
for file in migrations/*.sql; do
  echo "Aplicando: $file"
  psql "postgresql://modamayor:XXXXX@dpg-xxxxx.oregon-postgres.render.com/modamayor" -f "$file"
done
```

Reemplazar la URL con tu URL real.

### 7.2. Verificar que se aplicaron

```bash
# Conectar a la DB
psql "postgresql://modamayor:XXXXX@dpg-xxxxx.oregon-postgres.render.com/modamayor"

# Listar tablas
\dt

# Debe mostrar todas tus tablas:
# users, products, categories, orders, carts, etc.

# Salir
\q
```

### 7.3. Crear usuario admin inicial

```bash
# Conectar a la DB
psql "postgresql://modamayor:XXXXX@dpg-xxxxx.oregon-postgres.render.com/modamayor"
```

```sql
-- Crear admin (la contraseña es 'admin123' hasheada)
INSERT INTO users (name, email, password, role, created_at, updated_at) 
VALUES (
  'Admin', 
  'admin@modamayor.com', 
  '$2a$10$YourHashedPasswordHere',
  'admin',
  NOW(),
  NOW()
);
```

O usar el endpoint de registro desde la web después.

---

## 8. Configurar Dominio

### 8.1. Registrar Dominio

Si no lo hiciste, registrar en Namecheap (ver [RECOMENDACIONES_HOSTING.md](RECOMENDACIONES_HOSTING.md)).

Por ejemplo: `modamayor.com`

### 8.2. Configurar DNS en Namecheap

#### Opción A: DNS Directo (más simple)

1. Login en Namecheap
2. Domain List → Manage → Advanced DNS
3. Agregar registros:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | modamayor-frontend.onrender.com. | Automatic |
| ALIAS/ANAME | @ | modamayor-frontend.onrender.com. | Automatic |

*Nota: Si Namecheap no soporta ALIAS, usar CNAME solo para www.*

#### Opción B: Con CloudFlare (recomendado - mejor performance)

1. Crear cuenta en cloudflare.com
2. Add Site → `modamayor.com`
3. CloudFlare te da 2 nameservers (ej: `nat.ns.cloudflare.com`)
4. Volver a Namecheap → Domain → Nameservers → Custom DNS
5. Pegar los 2 nameservers de CloudFlare
6. En CloudFlare → DNS → Add records:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | @ | modamayor-frontend.onrender.com | ✓ Proxied |
| CNAME | www | modamayor-frontend.onrender.com | ✓ Proxied |
| CNAME | api | modamayor-backend.onrender.com | ✓ Proxied |

### 8.3. Agregar Custom Domain en Render

#### Para el Frontend:

1. Ir a `modamayor-frontend` service
2. Settings → Custom Domains
3. Add Custom Domain → Ingresar:
   - `modamayor.com`
   - `www.modamayor.com`
4. Render verifica el DNS (puede tomar 5-60 minutos)
5. Cuando esté verificado, **SSL se activa automáticamente** 🎉

#### Para el Backend (API):

1. Ir a `modamayor-backend` service
2. Settings → Custom Domains
3. Add Custom Domain → `api.modamayor.com`
4. Esperar verificación

### 8.4. Actualizar Variables de Entorno

#### Backend - Actualizar ALLOWED_ORIGINS:

```
https://modamayor.com,https://www.modamayor.com
```

#### Frontend - Actualizar NEXT_PUBLIC_API_URL:

```
https://api.modamayor.com
```

Guardar → Re-deploy automático.

### 8.5. Esperar propagación DNS

- DNS puede tardar 5 min - 24 horas
- Usualmente: 10-30 minutos
- Verificar en: https://dnschecker.org/

---

## 9. Verificar Todo Funciona

### 9.1. Probar URLs

```bash
# Backend health check
curl https://api.modamayor.com/health

# Debe responder:
# {"status":"ok","service":"modamayor-backend"}

# Frontend
curl https://modamayor.com

# Debe responder con HTML de Next.js
```

### 9.2. Probar en el Navegador

1. Ir a https://modamayor.com
2. Debe cargar la home page
3. Verificar que el candado HTTPS esté verde 🔒
4. Probar navegación
5. Probar registro de usuario
6. Probar login
7. Verificar que las imágenes cargan

### 9.3. Verificar HTTPS

- Ir a https://www.ssllabs.com/ssltest/
- Ingresar tu dominio
- Debe dar calificación A o A+

### 9.4. Checklist Final

- [ ] Backend responde en https://api.modamayor.com/health
- [ ] Frontend carga en https://modamayor.com
- [ ] www.modamayor.com redirige a modamayor.com (o viceversa)
- [ ] SSL funciona (candado verde)
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Productos se muestran correctamente
- [ ] Carrito funciona
- [ ] Admin panel accesible
- [ ] No hay errores en consola del navegador

✅ **Sistema completamente desplegado y funcionando!**

---

## 10. Actualizaciones

### 10.1. Deploy Automático

Render está conectado a tu repo de GitHub. Cada vez que hacés push, **se despliega automáticamente**.

```bash
# Hacer cambios en el código
vim internal/product/handler.go

# Commit y push
git add .
git commit -m "Fix: actualizar lógica de productos"
git push origin main

# Render detecta el push y hace deploy automáticamente
# Logs visibles en el dashboard de Render
```

### 10.2. Ver el Deploy en Progreso

1. Ir a Render Dashboard
2. Verás "Build in progress" con un spinner
3. Click en el servicio → Logs para ver el progreso
4. Cuando termine: "Build completed" → "Service live"

### 10.3. Rollback si algo sale mal

1. En el servicio → Events
2. Verás historial de deploys
3. Click en un deploy anterior → "Rollback to this version"
4. Confirmar

### 10.4. Aplicar Nuevas Migraciones

Si agregás una nueva migración:

```bash
# En tu máquina local
psql "postgresql://modamayor:XXXXX@dpg-xxxxx.oregon-postgres.render.com/modamayor" \
  -f migrations/20251225_nueva_migracion.sql
```

O crear un "Job" en Render que ejecute migraciones automáticamente.

---

## 11. Monitoreo y Logs

### 11.1. Ver Logs en Tiempo Real

1. Dashboard → Seleccionar servicio
2. Click "Logs"
3. Ver logs en tiempo real (se actualizan automáticamente)

### 11.2. Filtrar Logs

Render permite filtrar por:
- Timestamp
- Nivel (info, error, warning)
- Búsqueda de texto

### 11.3. Descargar Logs

Click "Download Logs" para guardar localmente.

### 11.4. Métricas

En cada servicio verás gráficos de:
- **CPU Usage**: Uso de CPU en %
- **Memory Usage**: Uso de RAM en MB
- **Response Time**: Latencia de requests
- **Request Rate**: Requests por segundo

### 11.5. Alertas

Render envía alertas automáticas por email si:
- El servicio se cae (crash)
- Health check falla
- Deploy falla

### 11.6. Uptime Monitoring Externo (Recomendado)

**UptimeRobot** (gratis):

1. Ir a https://uptimerobot.com/
2. Sign Up
3. Add New Monitor:
   - Type: HTTPS
   - URL: https://modamayor.com
   - Interval: 5 minutes
4. Add Alert Contacts: tu email
5. Repetir para https://api.modamayor.com

Te avisará por email/SMS si el sitio cae.

---

## 12. Troubleshooting

### 12.1. Build falla en el Backend

**Error**: `go: cannot find main module`

**Solución**:
```bash
# Verificar que go.mod esté en la raíz del proyecto
ls go.mod

# Si no existe, crearlo
go mod init go-modaMayor
go mod tidy
git add go.mod go.sum
git commit -m "Add go.mod"
git push
```

**Error**: `package X is not in GOROOT or module cache`

**Solución**:
```bash
# Descargar dependencias
go mod download
go mod tidy
git add go.mod go.sum
git commit -m "Update dependencies"
git push
```

### 12.2. Build falla en el Frontend

**Error**: `npm ERR! code ELIFECYCLE`

**Solución**: Verificar `front/package.json` tiene el script `build`:
```json
"scripts": {
  "build": "next build"
}
```

**Error**: `Module not found: Can't resolve 'X'`

**Solución**:
```bash
cd front
npm install X
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

### 12.3. Database connection failed

**Error**: `Failed to connect to database`

**Solución**:
1. Verificar que DATABASE_URL esté configurada correctamente
2. En Render → `modamayor-backend` → Environment
3. DATABASE_URL debe estar vinculada a `modamayor-db`
4. Click "Add from Database" → Seleccionar `modamayor-db` → Save

### 12.4. CORS Error en el Frontend

**Error**: `Access to fetch at 'https://api.modamayor.com' blocked by CORS`

**Solución**:
1. Verificar ALLOWED_ORIGINS en el backend incluye tu dominio
2. Debe ser: `https://modamayor.com,https://www.modamayor.com`
3. NO incluir trailing slash

### 12.5. SSL Certificate Error

**Error**: `NET::ERR_CERT_COMMON_NAME_INVALID`

**Solución**:
1. Esperar a que el DNS propague (puede tomar hasta 24h)
2. En Render → Custom Domains → verificar estado "Verified"
3. Si sigue fallando, eliminar el dominio y volver a agregarlo

### 12.6. Cold Starts (Free Tier)

**Problema**: La primera request tarda 30-60 segundos

**Explicación**: En el free tier, si no hay tráfico por 15 minutos, el servicio se "duerme".

**Soluciones**:
- **Opción 1**: Upgradear a plan pago ($7/mes) - no hay cold starts
- **Opción 2**: Usar un servicio de "ping" (ej: cron-job.org) que haga requests cada 10 min
- **Opción 3**: Aceptar el comportamiento (OK para desarrollo/pruebas)

### 12.7. Out of Memory

**Error**: `SIGKILL - Out of memory`

**Solución**:
1. El free tier tiene 512MB RAM (limitado)
2. Upgradear a plan pago con más RAM
3. O optimizar el código para usar menos memoria

### 12.8. Uploads no persisten

**Problema**: Subí imágenes pero después desaparecen

**Explicación**: Render usa filesystem efímero (se borra en cada deploy)

**Solución**: Usar almacenamiento externo:
- **Render Disks** (persistent storage) - $1/mes por 1GB
- **AWS S3** - muy usado, ~$0.023/GB/mes
- **Cloudinary** - especializado en imágenes, tiene free tier

**Implementación con Render Disk**:

1. En el servicio → Settings → Disks
2. Add Disk:
   - Name: `uploads`
   - Mount Path: `/var/data/uploads`
   - Size: 1 GB
3. Modificar código para usar `/var/data/uploads` en producción

### 12.9. Database alcanzó el límite (Free Tier)

**Problema**: Free tier tiene límite de 1GB de storage

**Solución**:
1. Ver uso actual en la DB → Metrics
2. Si estás cerca del límite, upgradear a plan pago ($7/mes por 10GB)
3. O limpiar datos de prueba

---

## 📊 Comparativa: Free vs Paid

| Feature | Free Tier | Starter ($7/mes por servicio) |
|---------|-----------|-------------------------------|
| **Cold Starts** | ✅ Sí (30-60s) | ❌ No - Siempre activo |
| **RAM** | 512 MB | 2 GB |
| **CPU** | Shared | Dedicated |
| **Concurrent Builds** | 1 | Unlimited |
| **DB Backup** | Manual | Automático |
| **Duración Free** | 90 días | - |
| **Ideal para** | Pruebas/MVP | Producción |

---

## 💡 Tips y Mejores Prácticas

### 1. Environment Variables

- ✅ Usar variables de entorno para todo (JWT_SECRET, API keys, etc.)
- ❌ NUNCA hacer commit de secretos en el código

### 2. Branches

Crear diferentes servicios para staging y producción:
- `main` branch → Producción
- `develop` branch → Staging (otro servicio en Render)

### 3. Logs

- Revisar logs regularmente
- Implementar logging estructurado (JSON logs)
- Usar niveles: INFO, WARNING, ERROR

### 4. Performance

- Habilitar compresión GZIP en Gin
- Usar índices en PostgreSQL para queries frecuentes
- Optimizar imágenes antes de subirlas

### 5. Seguridad

- Rotar JWT_SECRET periódicamente
- Implementar rate limiting
- Usar HTTPS obligatorio (redirect HTTP → HTTPS)
- Mantener dependencias actualizadas

### 6. Backups

El free tier no tiene backups automáticos.

**Crear backups manuales**:
```bash
# Desde tu máquina
pg_dump "postgresql://modamayor:XXX@dpg-xxx.oregon-postgres.render.com/modamayor" \
  > backup_$(date +%Y%m%d).sql

# Comprimir
gzip backup_*.sql

# Guardar en Google Drive, Dropbox, etc.
```

**Automatizar con cron** (en tu máquina):
```bash
crontab -e

# Backup diario a las 2 AM
0 2 * * * pg_dump "postgresql://..." | gzip > ~/backups/backup_$(date +\%Y\%m\%d).sql.gz
```

---

## 📈 Escalado Futuro

Cuando tu app crezca:

### Paso 1: Upgrade a Starter Plan ($14/mes total)
- Backend: $7/mes
- DB: $7/mes
- Sin cold starts, más RAM

### Paso 2: Separar Archivos (Storage)
- Implementar Cloudinary o AWS S3
- Liberar espacio en el servidor

### Paso 3: CDN (CloudFlare)
- Ya lo tenés si configuraste DNS ahí
- Mejora la velocidad global

### Paso 4: Más RAM si es necesario
- Backend: Upgrade a $25/mes (2GB RAM)
- DB: Upgrade a $25/mes (4GB RAM)

### Paso 5: Múltiples Instancias (High Availability)
- Configurar 2+ instancias del backend
- Load balancing automático
- Zero-downtime deploys

---

## 🎯 Checklist Post-Deploy

- [ ] ✅ Backend desplegado y funcionando
- [ ] ✅ Frontend desplegado y funcionando
- [ ] ✅ Base de datos creada y conectada
- [ ] ✅ Migraciones aplicadas
- [ ] ✅ Dominio configurado y propagado
- [ ] ✅ SSL/HTTPS funcionando (candado verde)
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Usuario admin creado
- [ ] ✅ Todas las funcionalidades testeadas
- [ ] ✅ Monitoring configurado (UptimeRobot)
- [ ] ✅ Backups configurados
- [ ] ✅ Email forwarding configurado
- [ ] ✅ Logs revisados sin errores
- [ ] ✅ Performance aceptable
- [ ] ✅ Mobile responsive
- [ ] ✅ SEO básico (meta tags)

---

## 📞 Recursos Útiles

### Documentación Oficial:
- **Render Docs**: https://render.com/docs
- **Render Go Guide**: https://render.com/docs/deploy-go
- **Render Next.js Guide**: https://render.com/docs/deploy-nextjs

### Comunidad:
- **Render Community**: https://community.render.com/
- **Render Status**: https://status.render.com/
- **Render GitHub**: https://github.com/render-examples

### Herramientas:
- **DNS Checker**: https://dnschecker.org/
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **UptimeRobot**: https://uptimerobot.com/
- **CloudFlare**: https://www.cloudflare.com/

---

## 🚀 Próximos Pasos

Después de desplegar:

1. **Configurar Google Analytics** (opcional)
   - Agregar tracking code al frontend
   - Monitorear tráfico y usuarios

2. **Configurar Emails Transaccionales** (cuando lo necesites)
   - SendGrid (12,000 emails/mes gratis)
   - AWS SES (muy barato)
   - Mailgun

3. **Agregar Testing**
   - Tests unitarios (Go + Jest)
   - Tests de integración
   - CI/CD con GitHub Actions

4. **Optimizar Performance**
   - Agregar caché (Redis)
   - Optimizar queries SQL
   - Implementar lazy loading

5. **Mejorar SEO**
   - Sitemap.xml
   - robots.txt
   - Meta tags dinámicos
   - Open Graph tags

6. **Seguridad Adicional**
   - Rate limiting
   - CAPTCHA en forms críticos
   - 2FA para admin

---

## 💰 Resumen de Costos

### Primer mes (Free Tier - 90 días):
```
Backend:           $0
Frontend:          $0
PostgreSQL:        $0
Dominio:           $10/año
Total:             $10 (solo dominio)
```

### Después del Free Tier (Producción):
```
Backend:           $7/mes
Frontend:          $0
PostgreSQL:        $7/mes
Dominio:           $10/año (~$1/mes)
Total:             $15/mes
```

### Costos Opcionales:
```
CloudFlare Pro:    $20/mes (CDN + analytics avanzado)
Render Disk:       $1/GB/mes (storage persistente)
Backups extras:    $0 (manual) o $2/mes (automático)
Emails:            $0 (SendGrid free) o $15/mes (profesional)
Monitoring:        $0 (UptimeRobot free)
```

---

**¡Sistema desplegado en Render con éxito!** 🎉

**Total setup time**: 1-2 horas  
**Mantenimiento mensual**: ~5 minutos (solo updates)  
**Costo mensual**: $15 USD después del trial

Cualquier duda, revisá la sección de Troubleshooting o los logs en Render Dashboard.

---

**Última actualización**: 26 de diciembre de 2025  
**Versión**: 1.0
