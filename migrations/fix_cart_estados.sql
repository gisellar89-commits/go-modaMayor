-- Script para corregir carritos en estados bloqueados
-- Ejecutar esto si los usuarios tienen carritos en estados que no permiten modificaciones

-- Ver todos los carritos y sus estados
SELECT id, user_id, estado, created_at, updated_at FROM carts ORDER BY updated_at DESC;

-- Actualizar carritos antiguos que estén en estados bloqueados a 'pendiente'
-- Esto permite que los usuarios puedan seguir usando sus carritos
UPDATE carts 
SET estado = 'pendiente' 
WHERE estado NOT IN ('pendiente', 'edicion', 'completado', 'pagado') 
   OR estado IS NULL;

-- Si prefieres crear nuevos carritos en lugar de actualizar:
-- Puedes cambiar el estado de los carritos viejos a 'completado' 
-- para que el sistema cree uno nuevo automáticamente
UPDATE carts 
SET estado = 'completado' 
WHERE estado IN ('listo_para_pago', 'cancelado') 
  AND updated_at < NOW() - INTERVAL '7 days';
