-- Eliminar columna price de product_variants ya que el precio es del producto, no de la variante
ALTER TABLE product_variants DROP COLUMN IF EXISTS price;
