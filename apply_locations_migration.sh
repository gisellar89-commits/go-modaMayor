#!/bin/bash

# Script para aplicar la migración de ubicaciones en producción
# Uso: ./apply_locations_migration.sh <DATABASE_URL>
# Ejemplo: ./apply_locations_migration.sh "postgresql://user:pass@host:5432/dbname"

set -e  # Salir si hay error

echo "════════════════════════════════════════════════════════════"
echo "  🚀 Migración: Sistema de Ubicaciones"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar que se pasó la URL
if [ -z "$1" ]; then
    echo "❌ Error: Falta la URL de la base de datos"
    echo ""
    echo "Uso:"
    echo "  ./apply_locations_migration.sh 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    echo "Ejemplo con Render:"
    echo "  ./apply_locations_migration.sh 'postgresql://modamayor:XXX@dpg-XXX.oregon-postgres.render.com/modamayor'"
    echo ""
    exit 1
fi

DB_URL="$1"

echo "📋 Información:"
echo "   - Migración: 20260204_create_locations_table.sql"
echo "   - Base de datos: ${DB_URL%%\?*}"  # Mostrar URL sin query params
echo ""

# Verificar que existe el archivo de migración
MIGRATION_FILE="migrations/20260204_create_locations_table.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: No se encuentra el archivo $MIGRATION_FILE"
    echo "   Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Confirmar antes de proceder
echo "⚠️  ADVERTENCIA: Esto modificará la base de datos de producción"
read -p "¿Deseas continuar? (si/no): " -r
echo
if [[ ! $REPLY =~ ^[Ss][Ii]$ ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📦 Aplicando migración..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Aplicar la migración
if psql "$DB_URL" -f "$MIGRATION_FILE"; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ✅ Migración aplicada correctamente"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    # Verificar que se crearon las ubicaciones
    echo "📊 Verificando ubicaciones creadas..."
    echo ""
    
    psql "$DB_URL" -c "SELECT id, code, name, active FROM locations ORDER BY display_order;" -t -A -F " | "
    
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  🎉 Deploy completado"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Próximos pasos:"
    echo "  1. ✅ Migración aplicada"
    echo "  2. 🔄 Deploy del backend (push a GitHub si usas CI/CD)"
    echo "  3. 🔄 Deploy del frontend (se rebuildeará automáticamente)"
    echo "  4. 🧪 Probar: curl https://tu-api.com/locations?active=true"
    echo "  5. 👤 Login como admin → Sidebar → Ubicaciones"
    echo ""
    echo "Ver: DEPLOY_LOCATIONS_UPDATE.md para más detalles"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ❌ Error al aplicar la migración"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Posibles causas:"
    echo "  - URL de base de datos incorrecta"
    echo "  - Credenciales inválidas"
    echo "  - Migración ya aplicada (verificar tabla 'locations')"
    echo "  - Problemas de red"
    echo ""
    echo "Para verificar si la tabla ya existe:"
    echo "  psql '$DB_URL' -c '\dt locations'"
    echo ""
    exit 1
fi
