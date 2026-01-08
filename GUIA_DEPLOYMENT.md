# 🚀 Guía de Deployment - go-modaMayor

## Guía Completa para Desplegar el Sistema en Producción

**Versión**: 1.0  
**Fecha**: 26 de diciembre de 2025  
**Última actualización**: 26/12/2025

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Preparación del Servidor](#2-preparación-del-servidor)
3. [Instalación de Dependencias](#3-instalación-de-dependencias)
4. [Configuración de PostgreSQL](#4-configuración-de-postgresql)
5. [Deploy del Backend](#5-deploy-del-backend)
6. [Deploy del Frontend](#6-deploy-del-frontend)
7. [Configuración de Nginx](#7-configuración-de-nginx)
8. [Configuración de SSL/HTTPS](#8-configuración-de-sslhttps)
9. [Configuración de Dominio](#9-configuración-de-dominio)
10. [Automatización con PM2](#10-automatización-con-pm2)
11. [Backups Automáticos](#11-backups-automáticos)
12. [Monitoreo y Logs](#12-monitoreo-y-logs)
13. [Actualizaciones](#13-actualizaciones)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Requisitos Previos

### 1.1. Lo que necesitas antes de empezar:
- ✅ Servidor Linux (Ubuntu 22.04 LTS recomendado)
- ✅ Acceso SSH al servidor
- ✅ Dominio registrado (ej: modamayor.com)
- ✅ Código fuente del proyecto en GitHub/GitLab
- ✅ Al menos 2GB RAM, 2 CPU cores, 20GB disco

### 1.2. Proveedores Recomendados:
**Opción 1: DigitalOcean** (Recomendado)
- Droplet de $12/mes (2GB RAM, 1 CPU, 50GB SSD)
- Muy fácil de usar
- [digitalocean.com](https://digitalocean.com)

**Opción 2: AWS (Amazon Web Services)**
- EC2 t3.small ($15-20/mes)
- Más escalable
- [aws.amazon.com](https://aws.amazon.com)

**Opción 3: Linode/Akamai**
- Precios similares a DigitalOcean
- [linode.com](https://linode.com)

**Opción 4: Google Cloud Platform**
- Compute Engine e2-small
- Créditos gratis para nuevos usuarios

### 1.3. Dominio
Registrar en:
- Namecheap
- GoDaddy
- Google Domains
- CloudFlare (registrar + DNS gratis)

---

## 2. Preparación del Servidor

### 2.1. Crear el Droplet/VM
1. Crear cuenta en DigitalOcean (o proveedor elegido)
2. Crear nuevo Droplet:
   - **Imagen**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $12/mes (2GB RAM)
   - **Datacenter**: Elegir cercano a tu ubicación (ej: NYC3)
   - **Authentication**: SSH Key (más seguro) o Password
   - **Hostname**: modamayor-prod

3. Esperar creación (1-2 minutos)
4. Anotar la **IP pública** (ej: 159.89.123.45)

### 2.2. Primer Acceso SSH
Desde tu terminal local:

```bash
ssh root@159.89.123.45
# Reemplazar con tu IP
```

Si usaste SSH key, no pedirá password. Si no, ingresar el password que te enviaron por email.

### 2.3. Actualizar el Sistema
```bash
# Actualizar repositorios
apt update

# Actualizar paquetes
apt upgrade -y

# Instalar utilidades básicas
apt install -y curl wget git vim ufw
```

### 2.4. Crear Usuario No-Root (Seguridad)
```bash
# Crear usuario
adduser deployer
# Ingresar password cuando lo pida

# Dar privilegios sudo
usermod -aG sudo deployer

# Copiar SSH keys
rsync --archive --chown=deployer:deployer ~/.ssh /home/deployer

# Cambiar a nuevo usuario
su - deployer
```

Desde ahora, trabajar como usuario `deployer`, no como root.

### 2.5. Configurar Firewall
```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Verificar estado
sudo ufw status
```

---

## 3. Instalación de Dependencias

### 3.1. Instalar Go 1.25+
```bash
# Descargar Go
cd /tmp
wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz

# Extraer
sudo tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz

# Configurar PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc

# Verificar instalación
go version
# Debe mostrar: go version go1.25.5 linux/amd64
```

### 3.2. Instalar Node.js 20+
```bash
# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 3.3. Instalar PostgreSQL
```bash
# Instalar PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar estado
sudo systemctl status postgresql
```

### 3.4. Instalar Nginx
```bash
# Instalar
sudo apt install -y nginx

# Iniciar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar
sudo systemctl status nginx
```

En este punto, si visitas `http://TU_IP` deberías ver la página de bienvenida de Nginx.

---

## 4. Configuración de PostgreSQL

### 4.1. Crear Usuario y Base de Datos
```bash
# Entrar a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
```

```sql
-- Crear usuario
CREATE USER modamayor WITH PASSWORD 'TU_PASSWORD_SEGURO_AQUI';

-- Crear base de datos
CREATE DATABASE modamayor OWNER modamayor;

-- Dar privilegios
GRANT ALL PRIVILEGES ON DATABASE modamayor TO modamayor;

-- Salir
\q
```

### 4.2. Configurar Acceso Remoto (Opcional)
Si querés conectarte desde tu máquina local para debugging:

```bash
# Editar postgresql.conf
sudo vim /etc/postgresql/15/main/postgresql.conf

# Buscar y cambiar:
listen_addresses = 'localhost'
# Por:
listen_addresses = '*'

# Editar pg_hba.conf
sudo vim /etc/postgresql/15/main/pg_hba.conf

# Agregar al final:
host    modamayor    modamayor    0.0.0.0/0    md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Abrir puerto en firewall
sudo ufw allow 5432/tcp
```

⚠️ **Seguridad**: Solo hacer esto si realmente lo necesitas. Es más seguro conectarse vía SSH tunnel.

### 4.3. Probar Conexión
```bash
psql -h localhost -U modamayor -d modamayor
# Ingresar password
# Si funciona, todo OK
\q
```

---

## 5. Deploy del Backend

### 5.1. Clonar Repositorio
```bash
# Ir a home
cd ~

# Clonar (reemplazar con tu repo)
git clone https://github.com/TU_USUARIO/go-modaMayor.git
cd go-modaMayor
```

Si el repo es privado:
```bash
# Generar SSH key en el servidor
ssh-keygen -t ed25519 -C "deployer@modamayor"
cat ~/.ssh/id_ed25519.pub
# Copiar la key y agregarla en GitHub → Settings → SSH Keys
```

### 5.2. Configurar Variables de Entorno
```bash
# Crear archivo .env en la raíz del proyecto
vim .env
```

Contenido del `.env`:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=modamayor
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_NAME=modamayor

# JWT
JWT_SECRET=TU_SECRET_SUPER_SEGURO_RANDOM_STRING_AQUI

# Server
PORT=8080
GIN_MODE=release

# CORS (tu dominio)
ALLOWED_ORIGINS=https://modamayor.com,https://www.modamayor.com

# Email (si usas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password-de-app
```

**Importante**: Generar JWT_SECRET seguro:
```bash
openssl rand -base64 32
# Copiar el output y usarlo como JWT_SECRET
```

### 5.3. Aplicar Migraciones
```bash
# Conectar a la base de datos y aplicar migraciones
PGPASSWORD=TU_PASSWORD psql -h localhost -U modamayor -d modamayor -f migrations/20251018_add_unique_index_location_stocks.sql
# Repetir para cada archivo .sql en orden cronológico

# O ejecutar todas las migraciones en orden:
for file in migrations/*.sql; do
  PGPASSWORD=TU_PASSWORD psql -h localhost -U modamayor -d modamayor -f "$file"
done
```

### 5.4. Compilar el Backend
```bash
# Descargar dependencias
go mod download

# Compilar
go build -o modamayor-server cmd/main.go

# Dar permisos de ejecución
chmod +x modamayor-server

# Probar que funciona
./modamayor-server
# Debería iniciar en puerto 8080
# Ctrl+C para detener
```

### 5.5. Crear Servicio Systemd
Para que el backend corra automáticamente:

```bash
# Crear archivo de servicio
sudo vim /etc/systemd/system/modamayor-backend.service
```

Contenido:
```ini
[Unit]
Description=ModaMayor Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=deployer
WorkingDirectory=/home/deployer/go-modaMayor
Environment="PATH=/usr/local/go/bin:/home/deployer/go/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/deployer/go-modaMayor/modamayor-server
Restart=always
RestartSec=5

# Logs
StandardOutput=append:/home/deployer/go-modaMayor/backend.log
StandardError=append:/home/deployer/go-modaMayor/backend.error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Iniciar servicio
sudo systemctl start modamayor-backend

# Verificar estado
sudo systemctl status modamayor-backend

# Habilitar inicio automático
sudo systemctl enable modamayor-backend

# Ver logs
sudo journalctl -u modamayor-backend -f
```

---

## 6. Deploy del Frontend

### 6.1. Preparar el Frontend
```bash
cd ~/go-modaMayor/front
```

### 6.2. Configurar Variables de Entorno
```bash
# Crear .env.production
vim .env.production
```

Contenido:
```env
NEXT_PUBLIC_API_URL=https://api.modamayor.com
```

**Importante**: Usar tu dominio real.

### 6.3. Instalar Dependencias y Compilar
```bash
# Instalar dependencias
npm ci

# Build de producción
npm run build

# Esto crea la carpeta .next con el build optimizado
```

### 6.4. Crear Servicio para Next.js
```bash
sudo vim /etc/systemd/system/modamayor-frontend.service
```

Contenido:
```ini
[Unit]
Description=ModaMayor Frontend
After=network.target

[Service]
Type=simple
User=deployer
WorkingDirectory=/home/deployer/go-modaMayor/front
Environment="PATH=/home/deployer/.nvm/versions/node/v20.11.0/bin:/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"
ExecStart=/home/deployer/.nvm/versions/node/v20.11.0/bin/npm start
Restart=always
RestartSec=5

# Logs
StandardOutput=append:/home/deployer/go-modaMayor/frontend.log
StandardError=append:/home/deployer/go-modaMayor/frontend.error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Iniciar
sudo systemctl start modamayor-frontend

# Verificar
sudo systemctl status modamayor-frontend

# Habilitar
sudo systemctl enable modamayor-frontend
```

---

## 7. Configuración de Nginx

### 7.1. Configurar Nginx como Reverse Proxy
```bash
# Crear configuración para el sitio
sudo vim /etc/nginx/sites-available/modamayor
```

Contenido:
```nginx
# Backend API
server {
    listen 80;
    server_name api.modamayor.com;

    # Uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8080;
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

# Frontend
server {
    listen 80;
    server_name modamayor.com www.modamayor.com;

    location / {
        proxy_pass http://localhost:3000;
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
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/modamayor /etc/nginx/sites-enabled/

# Eliminar sitio default
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Si todo OK, recargar
sudo systemctl reload nginx
```

---

## 8. Configuración de SSL/HTTPS

### 8.1. Instalar Certbot
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2. Obtener Certificados SSL
```bash
# Para api.modamayor.com
sudo certbot --nginx -d api.modamayor.com

# Para modamayor.com y www.modamayor.com
sudo certbot --nginx -d modamayor.com -d www.modamayor.com

# Responder las preguntas:
# - Email: tu-email@ejemplo.com
# - Aceptar términos: Yes
# - Compartir email: No (opcional)
# - Redirect HTTP a HTTPS: Yes (recomendado)
```

### 8.3. Verificar Renovación Automática
```bash
# Probar renovación
sudo certbot renew --dry-run

# Si funciona, certbot se renovará automáticamente cada 3 meses
```

### 8.4. Verificar HTTPS
Visitar:
- `https://modamayor.com` → Debería funcionar con candado verde
- `https://api.modamayor.com` → Debería responder

---

## 9. Configuración de Dominio

### 9.1. Configurar DNS
En tu proveedor de dominio (Namecheap, GoDaddy, etc.), agregar estos registros:

**Registros A**:
```
Tipo    Nombre              Valor               TTL
A       @                   159.89.123.45       3600
A       www                 159.89.123.45       3600
A       api                 159.89.123.45       3600
```

(Reemplazar `159.89.123.45` con tu IP real)

**Registro CNAME** (alternativa para www):
```
Tipo    Nombre    Valor           TTL
CNAME   www       modamayor.com   3600
```

### 9.2. Verificar Propagación
```bash
# Desde tu máquina local
nslookup modamayor.com
nslookup www.modamayor.com
nslookup api.modamayor.com

# Todos deben apuntar a tu IP
```

La propagación puede tomar entre 5 minutos y 48 horas (usualmente 1-2 horas).

### 9.3. Usar CloudFlare (Opcional pero Recomendado)
CloudFlare ofrece:
- DNS gratuito (más rápido)
- CDN gratuito
- Protección DDoS
- SSL adicional

**Pasos**:
1. Crear cuenta en cloudflare.com
2. Agregar sitio (modamayor.com)
3. CloudFlare te dará 2 nameservers
4. Cambiar los nameservers en tu registrador de dominio
5. Configurar DNS en CloudFlare (mismo que 9.1)
6. Habilitar SSL/TLS → Full (strict)

---

## 10. Automatización con PM2

Si preferís PM2 en lugar de systemd:

### 10.1. Instalar PM2
```bash
npm install -g pm2
```

### 10.2. Configurar PM2
```bash
# Frontend
cd ~/go-modaMayor/front
pm2 start npm --name "modamayor-frontend" -- start

# Para el backend, crear un script
vim ~/go-modaMayor/start-backend.sh
```

Contenido de `start-backend.sh`:
```bash
#!/bin/bash
cd /home/deployer/go-modaMayor
./modamayor-server
```

```bash
chmod +x ~/go-modaMayor/start-backend.sh
pm2 start ~/go-modaMayor/start-backend.sh --name "modamayor-backend"

# Guardar configuración
pm2 save

# Iniciar PM2 en boot
pm2 startup
# Ejecutar el comando que PM2 te muestra
```

### 10.3. Comandos Útiles PM2
```bash
pm2 list              # Ver procesos
pm2 logs              # Ver logs en tiempo real
pm2 restart all       # Reiniciar todos
pm2 stop all          # Detener todos
pm2 delete all        # Eliminar todos
pm2 monit             # Monitor en tiempo real
```

---

## 11. Backups Automáticos

### 11.1. Script de Backup de Base de Datos
```bash
# Crear directorio
mkdir -p ~/backups

# Crear script
vim ~/backups/backup-db.sh
```

Contenido:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deployer/backups"
DB_NAME="modamayor"
DB_USER="modamayor"
DB_PASSWORD="TU_PASSWORD"

# Backup
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/modamayor_$DATE.sql.gz

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "modamayor_*.sql.gz" -mtime +7 -delete

echo "Backup completado: modamayor_$DATE.sql.gz"
```

```bash
chmod +x ~/backups/backup-db.sh
```

### 11.2. Configurar Cron para Backups Diarios
```bash
crontab -e
```

Agregar:
```
# Backup diario a las 2 AM
0 2 * * * /home/deployer/backups/backup-db.sh >> /home/deployer/backups/backup.log 2>&1
```

### 11.3. Backup de Uploads (Imágenes)
```bash
vim ~/backups/backup-uploads.sh
```

Contenido:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deployer/backups"
UPLOADS_DIR="/home/deployer/go-modaMayor/uploads"

# Backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $(dirname $UPLOADS_DIR) $(basename $UPLOADS_DIR)

# Eliminar antiguos
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "Backup uploads completado: uploads_$DATE.tar.gz"
```

```bash
chmod +x ~/backups/backup-uploads.sh
```

Agregar a cron (semanal, domingos 3 AM):
```
0 3 * * 0 /home/deployer/backups/backup-uploads.sh >> /home/deployer/backups/backup.log 2>&1
```

### 11.4. Backup Remoto (Opcional)
Subir backups a AWS S3, Google Cloud Storage, o Dropbox para mayor seguridad.

---

## 12. Monitoreo y Logs

### 12.1. Ver Logs del Sistema
```bash
# Backend
sudo journalctl -u modamayor-backend -f

# Frontend
sudo journalctl -u modamayor-frontend -f

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### 12.2. Instalar Monitoring (Opcional)
**Opción 1: Netdata**
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```
Acceder en: `http://TU_IP:19999`

**Opción 2: UptimeRobot**
- Servicio gratuito
- Monitorea uptime desde afuera
- Alertas por email
- uptimerobot.com

### 12.3. Configurar Alertas
Si el servidor cae, recibir notificación:
- Configurar en UptimeRobot
- O usar servicio de tu proveedor (ej: DigitalOcean Monitoring)

---

## 13. Actualizaciones

### 13.1. Actualizar Código
```bash
# SSH al servidor
ssh deployer@TU_IP

# Ir al proyecto
cd ~/go-modaMayor

# Hacer backup por si acaso
cp -r ~/go-modaMayor ~/go-modaMayor.backup.$(date +%Y%m%d)

# Traer cambios
git pull origin main

# Backend
go build -o modamayor-server cmd/main.go
sudo systemctl restart modamayor-backend

# Frontend
cd front
npm ci
npm run build
sudo systemctl restart modamayor-frontend
```

### 13.2. Aplicar Nuevas Migraciones
```bash
# Si hay nuevos archivos .sql
PGPASSWORD=TU_PASSWORD psql -h localhost -U modamayor -d modamayor -f migrations/NUEVA_MIGRACION.sql
```

### 13.3. Verificar que Todo Funciona
```bash
# Verificar servicios
sudo systemctl status modamayor-backend
sudo systemctl status modamayor-frontend

# Ver logs por errores
sudo journalctl -u modamayor-backend -n 50
sudo journalctl -u modamayor-frontend -n 50
```

---

## 14. Troubleshooting

### 14.1. Backend no inicia
```bash
# Ver logs
sudo journalctl -u modamayor-backend -n 100

# Errores comunes:
# - Base de datos no conecta: Verificar credenciales en .env
# - Puerto en uso: sudo lsof -i :8080
# - Permisos: ls -la ~/go-modaMayor/modamayor-server
```

### 14.2. Frontend muestra error 502
```bash
# Verificar que Next.js esté corriendo
sudo systemctl status modamayor-frontend

# Verificar puerto 3000
sudo lsof -i :3000

# Reiniciar
sudo systemctl restart modamayor-frontend
```

### 14.3. Nginx error 502/504
```bash
# Ver logs de nginx
sudo tail -100 /var/log/nginx/error.log

# Probar conexión directa
curl http://localhost:8080/health
curl http://localhost:3000

# Si funcionan, problema es Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### 14.4. SSL no funciona
```bash
# Renovar certificado
sudo certbot renew --force-renewal

# Ver certificados
sudo certbot certificates

# Verificar configuración Nginx
sudo nginx -t
```

### 14.5. Base de datos lenta
```bash
# Ver conexiones
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Vacuumar base de datos
sudo -u postgres vacuumdb -d modamayor -z
```

---

## 📊 Checklist de Deployment

### Pre-Deploy
- [ ] Código testeado localmente
- [ ] Todas las migraciones funcionan
- [ ] Variables de entorno documentadas
- [ ] Dominio registrado y DNS configurado
- [ ] Servidor provisionado

### Deploy Backend
- [ ] Go instalado
- [ ] PostgreSQL instalado y configurado
- [ ] Base de datos creada
- [ ] Migraciones aplicadas
- [ ] .env configurado
- [ ] Backend compilado
- [ ] Servicio systemd creado y funcionando
- [ ] Logs sin errores

### Deploy Frontend
- [ ] Node.js instalado
- [ ] Dependencias instaladas
- [ ] Build de producción exitoso
- [ ] Variables de entorno configuradas
- [ ] Servicio systemd creado y funcionando
- [ ] Frontend accesible en localhost:3000

### Nginx y SSL
- [ ] Nginx instalado y configurado
- [ ] Reverse proxy funcionando
- [ ] Certificados SSL obtenidos
- [ ] HTTPS funcionando
- [ ] Redirect HTTP → HTTPS activo

### Seguridad
- [ ] Firewall configurado (UFW)
- [ ] Usuario no-root creado
- [ ] SSH con key (no password)
- [ ] Passwords seguros en .env
- [ ] PostgreSQL no expuesto (solo localhost)

### Monitoreo y Backups
- [ ] Backups automáticos configurados
- [ ] Logs monitoreados
- [ ] Alertas de uptime configuradas

### Final
- [ ] Sitio accesible en https://modamayor.com
- [ ] API accesible en https://api.modamayor.com
- [ ] Todos los features funcionan en producción
- [ ] Performance aceptable
- [ ] Documentación actualizada

---

## 🎯 Resumen Rápido

### Comandos Esenciales:
```bash
# Ver servicios
sudo systemctl status modamayor-backend
sudo systemctl status modamayor-frontend

# Reiniciar servicios
sudo systemctl restart modamayor-backend
sudo systemctl restart modamayor-frontend
sudo systemctl restart nginx

# Ver logs
sudo journalctl -u modamayor-backend -f
sudo journalctl -u modamayor-frontend -f

# Actualizar código
cd ~/go-modaMayor
git pull
go build -o modamayor-server cmd/main.go
sudo systemctl restart modamayor-backend
cd front && npm run build && sudo systemctl restart modamayor-frontend
```

### URLs Importantes:
- **Producción**: https://modamayor.com
- **API**: https://api.modamayor.com
- **Monitoring**: http://TU_IP:19999 (Netdata)

---

## 💰 Costos Mensuales Estimados

### Setup Básico:
- **Servidor**: $12/mes (DigitalOcean)
- **Dominio**: $10-15/año ($1.25/mes)
- **SSL**: Gratis (Let's Encrypt)
- **Total**: ~$13-14/mes

### Setup Profesional:
- **Servidor**: $24/mes (4GB RAM)
- **Dominio**: $15/año
- **CloudFlare Pro**: $20/mes (opcional)
- **Backups remotos**: $5/mes
- **Monitoring**: Gratis (Netdata, UptimeRobot)
- **Total**: ~$30-50/mes

---

## 📞 Soporte

Si tenés problemas durante el deployment:
1. Revisar esta guía paso a paso
2. Verificar logs (`journalctl`)
3. Consultar documentación oficial:
   - [Nginx](https://nginx.org/en/docs/)
   - [Let's Encrypt](https://letsencrypt.org/docs/)
   - [PostgreSQL](https://www.postgresql.org/docs/)
4. Stack Overflow
5. Comunidad de tu proveedor de hosting

---

**¡Sistema desplegado y en producción!** 🚀

**Próximos pasos**:
- Monitorear performance los primeros días
- Configurar Google Analytics
- Configurar emails transaccionales (SendGrid, AWS SES)
- Configurar backups remotos
- Documentar proceso de actualización para tu equipo
