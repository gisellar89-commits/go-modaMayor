# 📚 Guía de Configuración del Entorno - go-modaMayor

Esta guía te ayudará a configurar todo el entorno de desarrollo en cualquier nueva computadora.

## ✅ Estado Actual del Entorno

- ✅ **PostgreSQL**: Instalado y funcionando
- ✅ **Go**: Instalado (versión 1.25.5)
- ✅ **Node.js**: Instalado (versión 20.19.6)
- ✅ **Backend**: Corriendo en http://localhost:8080
- ✅ **Frontend**: Corriendo en http://localhost:3000

---

## 🔧 Prerequisitos Instalados

### 1. PostgreSQL
```bash
# Instalar
brew install postgresql@15

# Agregar al PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Iniciar como servicio
brew services start postgresql@15

# Crear base de datos
createdb modamayor

# Configurar contraseña del usuario
psql modamayor -c "ALTER USER $(whoami) WITH PASSWORD '8765abcd';"
```

### 2. Go
```bash
# Ya está instalado
go version  # go version go1.25.5 darwin/arm64
```

### 3. Node.js
```bash
# Instalar
brew install node@20

# Agregar al PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar
node --version  # v20.19.6
npm --version   # 10.8.2
```

---

## ⚙️ Configuración del Proyecto

### 1. Variables de Entorno del Backend

**Archivo**: `.env` (raíz del proyecto)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=gisellaromano
DB_PASSWORD=8765abcd
DB_NAME=modamayor
DB_SSLMODE=disable
AUTO_MIGRATE=true
```

### 2. Variables de Entorno del Frontend

**Archivo**: `front/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_LOCATIONS=deposito,mendoza,salta
```

---

## 🚀 Cómo Levantar el Entorno

### Opción A: Compilar y Ejecutar (Producción)

#### Backend:
```bash
# Desde la raíz del proyecto
cd /Users/gisellaromano/Documents/go-modaMayor

# Descargar dependencias
go mod download

# Compilar
go build -o server cmd/main.go

# Ejecutar
./server
```

#### Frontend:
```bash
# Desde la carpeta front
cd /Users/gisellaromano/Documents/go-modaMayor/front

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Opción B: Ejecutar en Modo Desarrollo

#### Backend:
```bash
cd /Users/gisellaromano/Documents/go-modaMayor
go run cmd/main.go
```

#### Frontend:
```bash
cd /Users/gisellaromano/Documents/go-modaMayor/front
npm run dev
```

---

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

---

## 📦 Base de Datos

### Aplicar Migraciones

Las migraciones SQL se encuentran en la carpeta `migrations/`. La primera vez que ejecutes el backend con `AUTO_MIGRATE=true`, GORM creará las tablas automáticamente.

Para aplicar migraciones SQL manualmente:
```bash
psql -U gisellaromano modamayor -f migrations/nombre_del_archivo.sql
```

### Verificar Conexión a la Base de Datos
```bash
psql -U gisellaromano modamayor
# Dentro de psql:
\dt  # Listar todas las tablas
\q   # Salir
```

---

## 🛠️ Comandos Útiles

### PostgreSQL
```bash
# Iniciar PostgreSQL
brew services start postgresql@15

# Detener PostgreSQL
brew services stop postgresql@15

# Ver estado
brew services list

# Conectar a la base de datos
psql -U gisellaromano modamayor
```

### Backend (Go)
```bash
# Descargar dependencias
go mod download

# Limpiar cache
go clean -modcache

# Compilar
go build -o server cmd/main.go

# Ejecutar tests (si existen)
go test ./...
```

### Frontend (Next.js)
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar versión de producción
npm start

# Limpiar cache
rm -rf .next node_modules
npm install
```

---

## 🔍 Verificar que Todo Funciona

### 1. Verificar Backend
```bash
curl http://localhost:8080/health
# Respuesta esperada: {"status":"ok"}
```

### 2. Verificar Frontend
Abre http://localhost:3000 en tu navegador.

### 3. Verificar Base de Datos
```bash
psql -U gisellaromano modamayor -c "SELECT COUNT(*) FROM users;"
```

---

## 📝 Notas Importantes

1. **Puerto 8080**: El backend corre en el puerto 8080. Asegúrate de que no haya otro proceso usando ese puerto.
   ```bash
   lsof -i :8080  # Ver qué proceso está usando el puerto
   ```

2. **Puerto 3000**: El frontend corre en el puerto 3000.
   ```bash
   lsof -i :3000  # Ver qué proceso está usando el puerto
   ```

3. **Primera Ejecución**: La primera vez que ejecutes el backend, GORM creará automáticamente las tablas necesarias si `AUTO_MIGRATE=true`.

4. **Logs del Backend**: Los logs se muestran en la terminal donde ejecutaste el servidor.

5. **Hot Reload**: 
   - El frontend tiene hot reload automático (Next.js)
   - El backend necesita reiniciarse manualmente para ver cambios

---

## 🐛 Solución de Problemas Comunes

### "Error: connect ECONNREFUSED"
El backend no está corriendo. Inicia el servidor backend primero.

### "dial tcp :5432: connect: connection refused"
PostgreSQL no está corriendo.
```bash
brew services start postgresql@15
```

### "relation does not exist"
Las tablas no se han creado. Asegúrate de que `AUTO_MIGRATE=true` en el `.env` y reinicia el backend.

### "Port 8080 already in use"
El backend ya está corriendo o hay otro proceso usando el puerto.
```bash
lsof -i :8080
kill -9 <PID>  # Reemplaza <PID> con el ID del proceso
```

---

## 📚 Estructura del Proyecto

```
go-modaMayor/
├── cmd/                  # Punto de entrada de la aplicación
│   └── main.go
├── config/              # Configuración de la base de datos
├── internal/            # Lógica de negocio (handlers, models)
├── migrations/          # Migraciones SQL
├── routes/              # Definición de rutas
├── front/               # Aplicación Next.js
│   ├── src/
│   └── public/
├── uploads/             # Archivos subidos
├── .env                 # Variables de entorno del backend
└── go.mod              # Dependencias de Go
```

---

## 🎯 Próximos Pasos

1. Crear usuario administrador inicial (si no existe)
2. Configurar categorías y productos de prueba
3. Configurar Postman con la colección incluida (`postman_collection_go-modaMayor.json`)

---

**¡Listo!** Tu entorno de desarrollo está completamente configurado y funcionando. 🎉
