# Sistema de Niveles de Precio Configurables

## 📋 Descripción General

Este sistema permite a los administradores y encargados configurar múltiples niveles de precio con diferentes fórmulas de cálculo y reglas de aplicación según la cantidad comprada.

## 🎯 Características Principales

### 1. **Múltiples Niveles de Precio**
- No limitado a 3 niveles fijos
- Cada nivel puede tener:
  - Nombre interno (clave única)
  - Nombre para mostrar al cliente
  - Descripción interna
  - Color de identificación
  - Estado activo/inactivo

### 2. **Fórmulas de Cálculo Flexibles**

Tres tipos de fórmulas disponibles:

#### **Multiplicador** (`multiplier`)
```
Precio = Costo × Multiplicador
Ejemplo: Costo = $100, Multiplicador = 2.5 → Precio = $250
```

#### **Porcentaje de Markup** (`percentage_markup`)
```
Precio = Costo + (Costo × Porcentaje / 100)
Ejemplo: Costo = $100, Porcentaje = 150% → Precio = $250
```

#### **Monto Fijo** (`flat_amount`)
```
Precio = Costo + Monto Fijo
Ejemplo: Costo = $100, Monto = $150 → Precio = $250
```

### 3. **Reglas de Aplicación**
- **Cantidad Mínima**: Define desde cuántas prendas se aplica el nivel
- **Orden de Prioridad**: Número que indica la prioridad (menor = mayor prioridad)
- **Nivel por Defecto**: Se aplica cuando ningún otro cumple condiciones

### 4. **Configuración Visual**
- Interfaz intuitiva en `/admin/configuracion/precios`
- Tabla ordenada por prioridad
- Modal de creación/edición con validaciones
- Visualización clara de fórmulas y condiciones

## 📂 Archivos Creados/Modificados

### Backend

1. **`internal/settings/model.go`**
   - Struct `PriceTier` con todos los campos necesarios
   - Método `CalculatePrice()` para cálculo según fórmula

2. **`internal/settings/price_helpers.go`**
   - `GetApplicablePriceTier()`: Obtiene tier según cantidad
   - `CalculatePriceForQuantity()`: Calcula precio final
   - `GetAllActiveTiers()`: Lista todos los tiers activos

3. **`internal/settings/handler/price_tiers.go`**
   - CRUD completo: GET, POST, PUT, DELETE
   - `ReorderPriceTiers()`: Reorganizar prioridades
   - `CalculatePricesForTiers()`: Endpoint auxiliar de cálculo

4. **`migrations/20251115_create_price_tiers.sql`**
   - Tabla `price_tiers` con todos los campos
   - Datos iniciales (4 niveles por defecto)
   - Índices para optimización

5. **`internal/product/handler.go`**
   - Modificado `CreateProduct()` para usar price tiers
   - Modificado `CreateProductFull()` para usar price tiers

6. **`internal/order/handler.go`**
   - Cálculo de precios en órdenes usa price tiers dinámicos
   - Fallback a cálculo tradicional si hay error

7. **`routes/router.go`**
   - Rutas para price tiers agregadas

### Frontend

1. **`front/src/app/admin/configuracion/precios/page.tsx`**
   - Página completa de administración
   - Tabla con todos los niveles
   - Modal para crear/editar
   - Validaciones y feedback

2. **`front/src/utils/priceCalculations.ts`**
   - Utilidades para cálculo en cliente
   - `calculatePriceForQuantity()`: Calcula según cantidad
   - `fetchPriceTiers()`: Obtiene tiers del backend
   - `formatPrice()`: Formato de moneda

3. **`front/src/components/AdminSidebar.tsx`**
   - Agregado link "Niveles de Precio" en sección Configuración

## 🚀 Cómo Usar

### Para Administradores

1. **Acceder a la Configuración**
   ```
   Dashboard → Configuración → Niveles de Precio
   ```

2. **Crear un Nuevo Nivel**
   - Click en "Crear Nivel"
   - Completar formulario:
     - Nombre interno (sin espacios)
     - Nombre a mostrar
     - Tipo de fórmula
     - Valores según fórmula
     - Cantidad mínima
     - Orden de prioridad
   - Guardar

3. **Editar un Nivel Existente**
   - Click en "Editar" en la fila del nivel
   - Modificar campos necesarios
   - Guardar

4. **Eliminar un Nivel**
   - Click en "Eliminar" (no disponible para nivel por defecto)
   - Confirmar eliminación

### Para Desarrolladores

#### Backend - Obtener precio aplicable

```go
import "go-modaMayor/internal/settings"

// Calcular precio para una cantidad
precio, tier, err := settings.CalculatePriceForQuantity(costPrice, quantity)
if err != nil {
    // Manejar error
}

// Usar precio calculado
fmt.Printf("Precio: %.2f (Tier: %s)\n", precio, tier.DisplayName)
```

#### Frontend - Usar utilidades de precio

```typescript
import { 
  fetchPriceTiers, 
  calculatePriceForQuantity,
  formatPrice 
} from '@/utils/priceCalculations';

// Obtener tiers
const tiers = await fetchPriceTiers();

// Calcular precio
const result = calculatePriceForQuantity(costPrice, quantity, tiers);
console.log(`Precio: ${formatPrice(result.price)}`);
console.log(`Tier aplicado: ${result.tier?.display_name}`);

// Ver todos los tiers con sus precios
result.allTiers.forEach(t => {
  console.log(`${t.tier.display_name}: ${formatPrice(t.price)} ${t.applies ? '✓' : ''}`);
});
```

## 📊 Datos Iniciales

La migración crea 4 niveles por defecto:

| Orden | Nombre | Fórmula | Cant. Mín. | Descripción |
|-------|--------|---------|------------|-------------|
| 4 | Precio Minorista | Costo × 1.0 | 0 | Por defecto (sin mínimo) |
| 3 | Precio Mayorista | Costo × 2.5 | 6 | A partir de 6 prendas |
| 2 | Descuento 1 | Costo × 2.25 | 8 | A partir de 8 prendas |
| 1 | Precio Final | Costo × 1.75 | 12 | A partir de 12 prendas |

## 🔄 Flujo de Aplicación

1. Cliente agrega productos al carrito
2. Sistema cuenta cantidad total de prendas
3. Backend obtiene todos los price tiers activos
4. Ordena por `order_index` (menor a mayor)
5. Encuentra el primer tier que cumpla `cantidad >= min_quantity`
6. Si ninguno cumple, usa el tier marcado como `is_default`
7. Calcula precio según la fórmula del tier aplicable
8. Aplica el precio a todos los productos del pedido

## 🔐 Permisos

- **Lectura**: Todos (endpoint público)
- **Crear/Editar/Eliminar**: Solo `admin` y `encargado`

## 🧪 Endpoints API

```
GET    /settings/price-tiers                    # Listar tiers activos
GET    /settings/price-tiers?include_inactive=true  # Incluir inactivos
GET    /settings/price-tiers/:id                # Obtener tier específico
POST   /settings/price-tiers                    # Crear tier
PUT    /settings/price-tiers/:id                # Actualizar tier
DELETE /settings/price-tiers/:id                # Eliminar tier
PUT    /settings/price-tiers/reorder            # Reordenar tiers
GET    /settings/price-tiers/calculate?cost_price=X&quantity=Y  # Calcular precios
```

## ⚙️ Instalación

1. **Aplicar migración**
   ```bash
   cd cmd
   go run cmd/apply_migration/main.go
   ```

2. **Reiniciar backend**
   ```bash
   go run cmd/main.go
   ```

3. **Acceder a la configuración**
   - Login como admin/encargado
   - Navegar a Dashboard → Configuración → Niveles de Precio

## 🎨 Personalización

### Agregar un nuevo tipo de fórmula

1. Modificar `PriceTier.CalculatePrice()` en `model.go`:
```go
case "custom_formula":
    return customCalculation(pt, costPrice)
```

2. Agregar opción en frontend:
```tsx
<option value="custom_formula">Fórmula Personalizada</option>
```

### Mostrar precios en productos

```typescript
import { fetchPriceTiers, calculatePriceForQuantity } from '@/utils/priceCalculations';

// En componente de producto
const [tiers, setTiers] = useState([]);

useEffect(() => {
  fetchPriceTiers().then(setTiers);
}, []);

// Mostrar precio según cantidad
const price = calculatePriceForQuantity(product.cost_price, cartQuantity, tiers);
```

## 📝 Notas Importantes

- ⚠️ Los cambios en price tiers NO afectan productos o pedidos existentes
- ⚠️ Solo un tier debe estar marcado como `is_default`
- ⚠️ El tier por defecto no se puede eliminar
- ⚠️ Los niveles con `order_index` menor tienen mayor prioridad
- ✅ El sistema tiene fallback al cálculo tradicional si hay errores
- ✅ Compatible con código legacy existente

## 🐛 Troubleshooting

### Los precios no se actualizan
- Verificar que los tiers estén marcados como `active = true`
- Revisar que las cantidades mínimas sean correctas
- Comprobar el `order_index` (menor = mayor prioridad)

### Error al crear producto
- Verificar que exista al menos un tier en la base de datos
- Revisar logs del backend para detalles del error

### La interfaz no carga
- Verificar que el backend esté corriendo en `localhost:8080`
- Comprobar permisos del usuario (debe ser admin o encargado)
- Revisar consola del navegador para errores

## 📚 Referencias

- Modelo: `internal/settings/model.go`
- Helpers: `internal/settings/price_helpers.go`
- Handlers: `internal/settings/handler/price_tiers.go`
- Frontend: `front/src/app/admin/configuracion/precios/page.tsx`
- Utilidades: `front/src/utils/priceCalculations.ts`
