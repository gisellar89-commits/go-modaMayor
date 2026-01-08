# 🎯 Recomendaciones de Hosting y Servicios

## Guía para Contratar Todo desde Cero

**Última actualización**: 26 de diciembre de 2025

---

## 📋 Resumen Ejecutivo

Para tu proyecto **go-modaMayor** necesitás:
1. **Servidor/VPS** para hospedar backend y frontend
2. **Dominio** para tu sitio (ej: modamayor.com)
3. **Base de datos** PostgreSQL (incluida en el servidor)
4. **SSL/HTTPS** (gratis con Let's Encrypt)
5. **Email** para notificaciones (opcional al inicio)

**Presupuesto mínimo**: USD $15-20/mes  
**Presupuesto recomendado**: USD $30-40/mes  
**Setup inicial**: 2-4 horas

---

## 🏆 RECOMENDACIÓN #1: DigitalOcean (Más fácil)

### ¿Por qué DigitalOcean?
✅ **Muy fácil de usar** - Interfaz súper intuitiva  
✅ **Documentación excelente** - Tutoriales paso a paso  
✅ **Comunidad grande** - Muchos recursos online  
✅ **Precios predecibles** - Sin sorpresas en la factura  
✅ **Backups automáticos** disponibles (+20% del costo)  
✅ **Buenos datacenters** en Latinoamérica (Miami, São Paulo)  

### Plan Recomendado
**Droplet Basic - $12/mes**
- 2 GB RAM
- 1 vCPU
- 50 GB SSD
- 2 TB transfer

**Alternativa si esperás mucho tráfico: $24/mes**
- 4 GB RAM
- 2 vCPUs
- 80 GB SSD
- 4 TB transfer

### Cómo contratar:

1. **Crear cuenta**
   - Ir a: https://www.digitalocean.com/
   - Click en "Sign Up"
   - Usar email y password
   - **TIP**: Buscar códigos de descuento (a veces dan $200 de crédito gratis por 60 días)
   - Códigos populares: "DO10", "DROPLET25" (verificar vigencia)

2. **Verificar cuenta**
   - Agregar tarjeta de crédito (o PayPal)
   - No te cobran hasta que uses los servicios
   - El crédito gratis se aplica automáticamente

3. **Crear Droplet**
   - Dashboard → "Create" → "Droplets"
   - **Choose Region**: 
     - Si estás en Argentina/Uruguay: **New York 3** (más cercano)
     - Alternativa: **São Paulo 1** (Brasil)
   - **Choose Image**: **Ubuntu 22.04 LTS x64**
   - **Choose Size**: 
     - Droplet Type: **Basic**
     - CPU Options: **Regular**
     - Plan: **$12/mo** (2GB RAM / 1 CPU)
   - **Choose Authentication**: 
     - **SSH Key** (más seguro - recomendado)
     - O **Password** (más simple)
   - **Hostname**: modamayor-prod
   - **Backups**: Opcional (+20% = $2.40/mes) - **RECOMENDADO**
   - **Monitoring**: Gratis - activar
   - Click "Create Droplet"

4. **Anotar tu IP**
   - Aparecerá en 1-2 minutos
   - Anotar la IP (ej: 167.99.234.123)
   - Listo para conectar por SSH

### Costos DigitalOcean:
```
Droplet $12/mes              = $12.00
Backups automáticos (20%)    = $ 2.40
Snapshots (opcional)         = $ 0.05/GB/mes
Monitoring                   = Gratis
Total mensual                = ~$15/mes
```

---

## 🥈 ALTERNATIVA #2: Linode/Akamai (Excelente relación calidad-precio)

### ¿Por qué Linode?
✅ **Precio/rendimiento** - Mejor hardware por el mismo precio  
✅ **Muy confiable** - Uptime excelente  
✅ **Soporte 24/7** - Responden rápido  
✅ **Facturación clara** - Sin cargos ocultos  
✅ **Recientemente comprado por Akamai** (más recursos)  

### Plan Recomendado
**Linode 2GB - $12/mes**
- 2 GB RAM
- 1 vCPU
- 50 GB SSD
- 2 TB transfer

### Cómo contratar:
1. Ir a: https://www.linode.com/
2. "Sign Up" con email/password
3. Verificar cuenta (tarjeta o PayPal)
4. "Create Linode"
5. Elegir:
   - **Image**: Ubuntu 22.04 LTS
   - **Region**: Miami, FL (más cercano a Argentina)
   - **Linode Plan**: Shared CPU → Linode 2GB ($12/mes)
   - **Label**: modamayor-prod
6. Click "Create Linode"

### Costos Linode:
```
Linode 2GB                   = $12.00/mes
Backups (opcional)           = $ 2.00/mes
Total mensual                = ~$14/mes
```

---

## 🥉 ALTERNATIVA #3: AWS Lightsail (Si querés AWS)

### ¿Por qué AWS Lightsail?
✅ **AWS pero simple** - Sin la complejidad de EC2  
✅ **IP estática gratis** - Incluida en el plan  
✅ **Integración con AWS** - Si después querés usar S3, etc.  
✅ **Primer mes gratis** - 3 meses para el plan más bajo  

### Plan Recomendado
**$10/mes** (medio limitado)
- 1 GB RAM
- 1 vCPU
- 40 GB SSD
- 2 TB transfer

**$20/mes** (recomendado)
- 2 GB RAM
- 1 vCPU
- 60 GB SSD
- 3 TB transfer

### Cómo contratar:
1. Crear cuenta AWS: https://aws.amazon.com/
2. Ir a Lightsail: https://lightsail.aws.amazon.com/
3. "Create instance"
4. Elegir:
   - **Location**: Virginia (us-east-1) - más cercano
   - **Platform**: Linux/Unix
   - **Blueprint**: OS Only → Ubuntu 22.04 LTS
   - **Plan**: $20/mes (2GB RAM)
5. "Create instance"

⚠️ **IMPORTANTE**: AWS puede ser confuso con la facturación. Asegurate de:
- Configurar "Billing Alerts"
- Revisar que no queden recursos activos no usados
- Usar "Free Tier" el primer año cuando sea posible

### Costos AWS Lightsail:
```
Instance $20/mes             = $20.00
Snapshots                    = $0.05/GB/mes
Static IP                    = Gratis
Total mensual                = ~$20-25/mes
```

---

## ❌ NO RECOMENDADOS para tu proyecto:

### Hostings compartidos (cPanel)
❌ **Hostgator, Bluehost, HostPapa, etc.**
- No permiten ejecutar aplicaciones Go
- No tenés control del servidor
- Solo sirven para WordPress/PHP
- **NO sirven para tu proyecto**

### Servicios "serverless" muy avanzados
❌ **AWS Lambda, Google Cloud Run, Vercel Pro**
- Muy complejos para empezar
- Facturación impredecible
- Mejor cuando ya tenés experiencia

### VPS muy baratos
❌ **OVH ($3/mes), Contabo, etc.**
- Soporte malo
- Performance inconsistente
- Pueden suspender cuenta sin aviso

---

## 🌐 Contratar Dominio

### Opción 1: Namecheap (RECOMENDADO)
**Por qué Namecheap:**
✅ Precios honestos  
✅ No inflan renovaciones como GoDaddy  
✅ WhoisGuard gratis (protege tus datos)  
✅ DNS fácil de configurar  

**Cómo contratar:**
1. Ir a: https://www.namecheap.com/
2. Buscar tu dominio: "modamayor.com"
3. Si está disponible, agregar al carrito
4. Elegir período: **1 año** (después ves si renovar)
5. **Extras**:
   - WhoisGuard: GRATIS (incluido) - **Activar**
   - PremiumDNS: NO (usarás CloudFlare gratis)
   - Email: NO (por ahora)
6. Checkout con tarjeta/PayPal

**Costo .com:**
```
Primer año:     $8-10 USD
Renovación:     $10-12 USD/año
WhoisGuard:     Gratis
Total:          ~$10/año
```

### Opción 2: Google Domains → Squarespace
**Nota**: Google vendió Google Domains a Squarespace en 2023.

- Ir a: https://domains.squarespace.com/
- Precios similares a Namecheap
- Integración con Google Services

**Costo:** $12 USD/año

### Opción 3: Cloudflare Registrar
**Ventaja**: Precio al costo (sin margen)

1. Primero necesitás una cuenta CloudFlare (gratis)
2. Ir a: https://www.cloudflare.com/products/registrar/
3. Registrar dominio a precio de costo

**Costo .com:** $9.77 USD/año (exactamente el costo de ICANN)

⚠️ **Nota**: Solo podés registrar si ya tenés dominio en CloudFlare o si transferís uno existente.

### Opción 4: GoDaddy
⚠️ **NO recomendado** - Precios inflados en renovación

Primer año: $2.99 USD (oferta)  
Renovación: $19.99 USD/año ❌ (muy caro)

---

## 🌍 Dominios para Argentina específicamente

Si querés un .com.ar:

### NIC Argentina
- Sitio oficial: https://nic.ar/
- **Costo**: ~$600-800 ARS/año (muy barato)
- **Requisitos**: 
  - CUIT/CUIL
  - DNI
  - Comprobante de domicilio
- **Proceso**: Más burocrático que .com

### Ventaja .com.ar:
- Más barato
- Identidad local argentina
- Bueno para SEO local

### Desventaja .com.ar:
- Proceso más lento (1-3 días)
- Menos internacional
- Configuración DNS puede ser menos intuitiva

**Recomendación**: Empezá con **.com** (internacional) y después podés comprar .com.ar y redirigir.

---

## 🔐 SSL/HTTPS (Certificado de Seguridad)

### Let's Encrypt (RECOMENDADO - GRATIS)
✅ **Completamente gratis**  
✅ **Renovación automática**  
✅ **Reconocido por todos los navegadores**  
✅ **Instalación automática con Certbot**  

**No necesitás comprar nada** - se configura gratis en el servidor con un comando.

### Alternativas de pago (NO necesarias)
❌ Namecheap PositiveSSL ($8/año) - innecesario  
❌ Comodo SSL ($50/año) - innecesario  
❌ CloudFlare SSL ($0 en plan gratis) - buena opción

**Conclusión**: Usá Let's Encrypt gratis, funciona perfecto.

---

## 📧 Email (Opcional al inicio)

Para emails del tipo: ventas@modamayor.com, info@modamayor.com

### Opción 1: Gmail/Outlook con tu dominio
**NO recomendado** - Requiere Google Workspace ($6/usuario/mes)

### Opción 2: Namecheap Email
- $1.19/mes por casilla
- Básico pero funciona

### Opción 3: Zoho Mail (RECOMENDADO - GRATIS)
✅ **Plan gratuito**: 1 dominio, hasta 5 usuarios  
✅ **5GB por usuario**  
✅ **Webmail + IMAP/SMTP**  

1. Ir a: https://www.zoho.com/mail/
2. Sign Up for Free
3. Agregar tu dominio
4. Configurar registros DNS (MX, TXT)
5. Listo - emails gratis

### Opción 4: Forwarding (MUY simple)
**Ideal para empezar:**
- Namecheap incluye "Email Forwarding" gratis
- info@modamayor.com → redirige a tu Gmail personal
- No podés enviar desde info@, solo recibir
- **Perfecto para las primeras semanas**

**Recomendación**: Empezá con Email Forwarding (gratis) y después migrá a Zoho Mail cuando necesites enviar emails profesionales.

---

## 📦 Recomendación de Package Completo

### 🏅 SETUP RECOMENDADO (Mejor balance)

| Servicio | Proveedor | Costo Mensual | Costo Anual |
|----------|-----------|---------------|-------------|
| **VPS/Servidor** | DigitalOcean Droplet 2GB | $12.00 | $144 |
| **Backups** | DigitalOcean | $2.40 | $28.80 |
| **Dominio** | Namecheap .com | - | $10 |
| **SSL** | Let's Encrypt | Gratis | - |
| **Email** | Zoho Mail Free / Forwarding | Gratis | - |
| **DNS** | CloudFlare Free | Gratis | - |
| **Monitoring** | UptimeRobot Free | Gratis | - |

**Total primer año**: $182.80 USD (~$15/mes)  
**Total mensual regular**: $14.40 USD

### 🚀 SETUP PROFESIONAL (Mejor performance)

| Servicio | Proveedor | Costo Mensual | Costo Anual |
|----------|-----------|---------------|-------------|
| **VPS/Servidor** | DigitalOcean Droplet 4GB | $24.00 | $288 |
| **Backups** | DigitalOcean | $4.80 | $57.60 |
| **Dominio** | Namecheap .com | - | $10 |
| **SSL** | Let's Encrypt | Gratis | - |
| **Email** | Zoho Mail Paid | $1.00 | $12 |
| **DNS** | CloudFlare Pro | $20.00 | $240 |
| **Storage S3** | DigitalOcean Spaces | $5.00 | $60 |
| **CDN** | CloudFlare Pro | (incluido) | - |

**Total primer año**: $667.60 USD (~$55/mes)  
**Total mensual regular**: $54.80 USD

### 💡 SETUP MÍNIMO (Empezar económico)

| Servicio | Proveedor | Costo Mensual | Costo Anual |
|----------|-----------|---------------|-------------|
| **VPS/Servidor** | Linode 2GB | $12.00 | $144 |
| **Backups** | Manual (scripts) | Gratis | - |
| **Dominio** | CloudFlare Registrar | - | $9.77 |
| **SSL** | Let's Encrypt | Gratis | - |
| **Email** | Email Forwarding | Gratis | - |
| **DNS** | CloudFlare Free | Gratis | - |

**Total primer año**: $153.77 USD (~$12.80/mes)  
**Total mensual regular**: $12.00 USD

---

## 📝 Plan de Acción Paso a Paso

### PASO 1: Registrar Dominio (Día 1)
**Tiempo**: 15 minutos  
**Costo**: $10 USD

1. Ir a Namecheap.com
2. Buscar dominio deseado
3. Comprar por 1 año
4. Activar WhoisGuard (gratis)
5. **NO comprar extras** (email, etc.)

### PASO 2: Contratar Servidor (Día 1)
**Tiempo**: 20 minutos  
**Costo**: $12-24 USD/mes

1. Crear cuenta DigitalOcean
2. Buscar código promocional ("DO10", "DROPLET200")
3. Crear Droplet:
   - Ubuntu 22.04 LTS
   - 2GB RAM ($12/mes) o 4GB ($24/mes)
   - Región: New York 3
   - Backups: Sí
4. Anotar IP pública

### PASO 3: Configurar DNS (Día 1)
**Tiempo**: 30 minutos  
**Costo**: Gratis

**Opción A: DNS en Namecheap** (más simple)
1. Login en Namecheap
2. Manage domain → Advanced DNS
3. Agregar registros:
   ```
   Type    Host    Value           TTL
   A       @       TU_IP_SERVIDOR  Automatic
   A       www     TU_IP_SERVIDOR  Automatic
   A       api     TU_IP_SERVIDOR  Automatic
   ```

**Opción B: DNS en CloudFlare** (recomendado - mejor performance)
1. Crear cuenta en cloudflare.com
2. "Add a Site" → ingresar tu dominio
3. Plan Free (gratis)
4. CloudFlare te dará 2 nameservers (ej: nat.ns.cloudflare.com)
5. Volver a Namecheap → Domain → Nameservers → Custom DNS
6. Ingresar los 2 nameservers de CloudFlare
7. Volver a CloudFlare → DNS → Add records:
   ```
   Type    Name    Content         Proxy
   A       @       TU_IP_SERVIDOR  ✓ Proxied
   A       www     TU_IP_SERVIDOR  ✓ Proxied
   A       api     TU_IP_SERVIDOR  ✓ Proxied
   ```

Esperar propagación: 5 min - 2 horas

### PASO 4: Configurar Email Forwarding (Día 1)
**Tiempo**: 10 minutos  
**Costo**: Gratis

1. Namecheap → Domain → Email Forwarding
2. Agregar:
   ```
   info@modamayor.com → tu-email-personal@gmail.com
   ventas@modamayor.com → tu-email-personal@gmail.com
   ```
3. Guardar

### PASO 5: Deploy del Sistema (Día 1-2)
**Tiempo**: 2-4 horas  
**Costo**: -

Seguir la [GUIA_DEPLOYMENT.md](GUIA_DEPLOYMENT.md) que te pasé antes:
1. Conectar por SSH al servidor
2. Instalar Go, Node, PostgreSQL, Nginx
3. Clonar repositorio
4. Configurar base de datos
5. Deploy backend
6. Deploy frontend
7. Configurar Nginx
8. Instalar SSL con Let's Encrypt

### PASO 6: Verificar Todo Funciona (Día 2)
**Tiempo**: 1 hora  
**Costo**: -

1. Visitar https://modamayor.com → debe cargar el sitio
2. Visitar https://api.modamayor.com/health → debe responder
3. Probar login, registro, etc.
4. Revisar logs: `sudo journalctl -u modamayor-backend -f`

### PASO 7: Configurar Monitoreo (Día 2)
**Tiempo**: 30 minutos  
**Costo**: Gratis

1. Crear cuenta en uptimerobot.com
2. Add New Monitor:
   - Type: HTTPS
   - URL: https://modamayor.com
   - Interval: 5 minutes
3. Alert Contacts: tu email
4. Repetir para https://api.modamayor.com

### PASO 8: Configurar Backups (Día 2)
**Tiempo**: 20 minutos  
**Costo**: Ya incluido ($2.40/mes)

Si activaste Backups en DigitalOcean → automático.

Si no, configurar backups manuales con cron (ver GUIA_DEPLOYMENT.md sección 11).

---

## 💰 Resumen de Costos

### Inversión Inicial (Una sola vez):
```
Dominio primer año:          $10 USD
Tiempo de setup (tu tiempo): 4-6 horas
Total:                       $10 USD
```

### Costos Mensuales Recurrentes:
```
MÍNIMO:
- Servidor 2GB:              $12/mes
- Backups:                   $ 2/mes (opcional)
Total:                       $14/mes

RECOMENDADO:
- Servidor 4GB:              $24/mes
- Backups:                   $ 5/mes
- Dominio (prorrateado):     $ 1/mes
Total:                       $30/mes

PROFESIONAL:
- Servidor 4GB:              $24/mes
- Backups:                   $ 5/mes
- CloudFlare Pro:            $20/mes
- Storage S3:                $ 5/mes
- Email Zoho:                $ 1/mes
Total:                       $55/mes
```

### Primer Año Completo:
```
MÍNIMO:        $154 USD ($12 servidor + $10 dominio + $2 backups x11)
RECOMENDADO:   $334 USD ($24 servidor + $10 dominio + $5 backups x12)
PROFESIONAL:   $670 USD (full stack)
```

---

## 🎯 Mi Recomendación Final

Para **go-modaMayor**, empezando desde cero:

### ✅ Contratar HOY:
1. **Dominio**: Namecheap - modamayor.com - $10/año
2. **Servidor**: DigitalOcean Droplet 2GB - $12/mes
3. **Backups**: Activar en DigitalOcean - $2.40/mes

### ✅ Configurar HOY (Gratis):
4. **DNS**: CloudFlare plan Free
5. **SSL**: Let's Encrypt (se instala en deploy)
6. **Email**: Email Forwarding de Namecheap
7. **Monitoreo**: UptimeRobot plan Free

### ✅ Migrar DESPUÉS (cuando crezcas):
- Servidor a 4GB: cuando tengas 50+ usuarios simultáneos
- CloudFlare Pro: cuando necesites analytics avanzados
- Zoho Mail pago: cuando necesites enviar emails profesionales masivos
- DigitalOcean Spaces: cuando tengas 1000+ productos con imágenes

**Total inicial**: $14.40 USD/mes + $10 dominio = **$25 el primer mes**, luego $14.40/mes

---

## 🔗 Links Útiles

### Proveedores Recomendados:
- **DigitalOcean**: https://www.digitalocean.com/
- **Linode**: https://www.linode.com/
- **Namecheap**: https://www.namecheap.com/
- **CloudFlare**: https://www.cloudflare.com/

### Códigos de Descuento (verificar vigencia):
- DigitalOcean: "DO10", "DROPLET200", "DORETRY10"
- Namecheap: "NEWCOM598" (verificar en Google "namecheap coupon")

### Calculadoras de Costo:
- DigitalOcean: https://www.digitalocean.com/pricing/calculator
- AWS: https://calculator.aws/

### Comparadores:
- https://www.vpsbenchmarks.com/
- https://hostingfacts.com/vps-hosting-comparison/

---

## ❓ Preguntas Frecuentes

### ¿Puedo empezar con un plan más chico y upgradear?
✅ Sí, en DigitalOcean podés hacer "resize" del droplet en cualquier momento. El downtime es ~1 minuto.

### ¿Qué pasa si me quedo sin espacio/RAM?
✅ Podés upgradear el plan o agregar "Volumes" (discos adicionales).

### ¿Puedo cambiar de proveedor después?
✅ Sí, pero implica migrar todo. Es más fácil empezar con el correcto.

### ¿Necesito saber Linux para esto?
⚠️ Básico sí. La GUIA_DEPLOYMENT.md tiene todos los comandos exactos copy-paste.

### ¿Puedo usar Windows Server?
❌ No recomendado. Linux es gratis, más eficiente y tiene mejor soporte para Go/Node/PostgreSQL.

### ¿Qué pasa con el tráfico/bandwidth?
✅ Los planes incluyen 2-4TB/mes. Para un e-commerce, alcanza para 50,000+ visitas/mes.

### ¿Necesito CloudFlare?
⚠️ No es obligatorio al inicio, pero **muy recomendado** porque:
- DNS más rápido (gratis)
- CDN global (gratis)
- Protección DDoS (gratis)
- Analytics básicos (gratis)

### ¿Cuándo necesito upgradear a 4GB RAM?
Cuando:
- Tengas 30-50+ usuarios simultáneos
- La base de datos tenga 10,000+ productos
- El servidor use consistentemente >80% RAM

---

## 📞 Próximos Pasos

1. ✅ **Leer este documento completo**
2. ✅ **Decidir presupuesto** (mínimo $15/mes, recomendado $30/mes)
3. ✅ **Elegir nombre de dominio** y verificar disponibilidad
4. ✅ **Registrar dominio** en Namecheap
5. ✅ **Contratar servidor** en DigitalOcean
6. ✅ **Configurar DNS** en CloudFlare
7. ✅ **Seguir GUIA_DEPLOYMENT.md** para deploy

**¿Dudas?** Revisá la sección de Troubleshooting o preguntame.

---

**¡Todo listo para empezar!** 🚀

Con $25 USD y 4-6 horas de trabajo tenés tu sistema completo en producción.
