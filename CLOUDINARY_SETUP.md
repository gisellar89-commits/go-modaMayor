# Configuración de Cloudinary en Render

## 🎯 Variables de Entorno para Render (BACKEND)

Añade estas variables de entorno en tu **servicio de BACKEND** en Render (el que corre Go, NO el frontend):

**Servicio: `go-modamayor-backend` (o el nombre de tu servicio de Go)**

```
CLOUDINARY_CLOUD_NAME=de3do7vsj
CLOUDINARY_API_KEY=976863789327936
CLOUDINARY_API_SECRET=5f5IQjH5ZLn0Yk_IHcs-1hTwy14
```

## ✅ Cómo agregar las variables en Render:

1. Ve a tu **servicio de BACKEND (Go)** en Render Dashboard
2. Click en **"Environment"** en el menú lateral izquierdo
3. Click en **"Add Environment Variable"**
4. Agrega cada una de las 3 variables con sus valores exactos
5. Click en **"Save Changes"**
6. Render hará un **redeploy automático** del backend

## 📸 Qué hace Cloudinary:

- ✅ Las imágenes se subirán a Cloudinary en lugar de guardarse localmente
- ✅ Las URLs guardadas en la base de datos serán: `https://res.cloudinary.com/de3do7vsj/image/upload/v.../products/product_1.jpg`
- ✅ Las imágenes **persisten entre deploys**
- ✅ CDN global incluido (imágenes rápidas en todo el mundo)
- ✅ 25 GB de almacenamiento gratis
- ✅ 25 GB de bandwidth gratis por mes

## 🔄 Migración de imágenes existentes:

Si ya tienes productos con imágenes locales en la BD:
1. Las imágenes locales ya no se pueden acceder (se borraron en el deploy)
2. Debes volver a subir las imágenes desde el admin
3. Las nuevas imágenes se guardarán automáticamente en Cloudinary

## 🧪 Probar localmente:

El archivo `.env` ya tiene las credenciales configuradas. Para probar:

```bash
# Iniciar el servidor
go run cmd/main.go

# Verás el mensaje:
# ✅ Cloudinary inicializado correctamente
```

Luego ve al admin, edita un producto y sube una imagen. Verás que la URL guardada empieza con `https://res.cloudinary.com/`

## ⚠️ Importante:

- Las credenciales de Cloudinary YA están configuradas en tu archivo `.env` local
- NO subas el archivo `.env` al repositorio (ya está en .gitignore)
- En Render, configura las variables manualmente como se indica arriba
