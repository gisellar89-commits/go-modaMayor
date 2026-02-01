#!/bin/bash

# Script para registrar todas las migraciones existentes como aplicadas
# Útil cuando migras de sistema manual a automático

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Registrar Migraciones Existentes${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Verificar que exista la carpeta migrations
if [ ! -d "migrations" ]; then
    echo -e "${YELLOW}❌ Error: No se encontró la carpeta 'migrations'${NC}"
    exit 1
fi

# Contar migraciones
MIGRATION_COUNT=$(ls -1 migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No se encontraron archivos .sql en migrations/${NC}"
    exit 0
fi

echo -e "${GREEN}✓ Se encontraron $MIGRATION_COUNT migraciones${NC}"
echo ""
echo "Este script generará SQL para registrar todas las migraciones como aplicadas."
echo "Úsalo SOLO si ya ejecutaste manualmente estas migraciones en tu base de datos."
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado."
    exit 0
fi

# Generar SQL
echo ""
echo -e "${BLUE}SQL generado:${NC}"
echo "-- Registrar migraciones existentes como aplicadas"
echo "-- Generado: $(date)"
echo ""

for file in migrations/*.sql; do
    filename=$(basename "$file")
    echo "INSERT INTO migration_records (name) VALUES ('$filename') ON CONFLICT (name) DO NOTHING;"
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Instrucciones:${NC}"
echo ""
echo "1. Copia el SQL generado arriba"
echo "2. Conéctate a tu base de datos de producción:"
echo ""
echo -e "   ${YELLOW}psql \"\$DATABASE_URL\"${NC}"
echo ""
echo "3. Pega y ejecuta el SQL"
echo "4. Verifica con:"
echo ""
echo -e "   ${YELLOW}SELECT COUNT(*) FROM migration_records;${NC}"
echo ""
echo "   Deberías ver $MIGRATION_COUNT registros"
echo ""
echo -e "${GREEN}================================================${NC}"
