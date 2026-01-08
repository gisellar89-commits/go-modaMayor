# Guía: Carrito para Usuarios No Logueados

## 📋 Resumen de Cambios

Se ha implementado soporte para que usuarios no logueados puedan ver productos y precios, pero con las siguientes limitaciones:

### ✅ Lo que Funciona

1. **Ver productos y detalles** - Sin necesidad de login
2. **Ver precios base** - Solo se muestra el precio del primer tier (tier default)
3. **Botón "Agregar al carrito" visible** - Pero el carrito se maneja en localStorage del frontend

### ❌ Limitaciones para Usuarios No Logueados

1. **No pueden guardar el carrito en el servidor** - Solo en localStorage
2. **No acceden a precios por volumen** - Solo tier base
3. **No pueden solicitar vendedora** - Requiere login
4. **No pueden finalizar compra** - Requiere login

## 🔧 Cambios en el Backend

### 1. Nuevo Middleware: `OptionalAuthMiddleware`
Permite que un endpoint funcione con o sin autenticación. Si hay token válido, lo usa; si no, continúa sin error.

### 2. Endpoint Modificado: `POST /cart/add`
Ahora usa `OptionalAuthMiddleware`:
- **Con autenticación**: Funciona normalmente, guarda en base de datos
- **Sin autenticación**: Responde con:
```json
{
  "message": "Para guardar el carrito y realizar la compra, por favor inicia sesión",
  "requires_login": true,
  "cart_local_only": true
}
```

### 3. Nuevo Endpoint: `POST /cart/guest-price`
Calcula el precio de un producto usando solo el tier base (para invitados).

**Request:**
```json
{
  "product_id": 123,
  "quantity": 5
}
```

**Response:**
```json
{
  "product_id": 123,
  "product_name": "Remera X",
  "quantity": 5,
  "unit_price": 1500.50,
  "subtotal": 7502.50,
  "tier": {
    "id": 1,
    "name": "tier_1",
    "display_name": "Precio Base",
    "formula_type": "multiplier",
    "multiplier": 2.0,
    "min_quantity": 1
  },
  "message": "Precio base. Inicia sesión para acceder a precios por volumen",
  "requires_login_for_better_prices": true
}
```

## 🎯 Implementación en Frontend

### Estrategia Recomendada

1. **Almacenar carrito en localStorage** cuando el usuario NO está logueado
2. **Mostrar notificación** indicando que deben loguearse para:
   - Acceder a precios por volumen
   - Solicitar asistencia de vendedora
   - Finalizar la compra
3. **Al hacer login**: Migrar el carrito de localStorage al servidor

### Ejemplo de Flujo

```typescript
// 1. Usuario NO logueado intenta agregar al carrito
const addToCart = async (productId: number, variantId: number, quantity: number) => {
  const token = getAuthToken(); // null si no está logueado
  
  if (!token) {
    // Usuario no logueado: guardar en localStorage
    const localCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    localCart.push({ productId, variantId, quantity });
    localStorage.setItem('guest_cart', JSON.stringify(localCart));
    
    // Calcular precio usando el endpoint público
    const priceResponse = await fetch('/cart/guest-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity })
    });
    const priceData = await priceResponse.json();
    
    // Mostrar notificación
    showNotification({
      type: 'info',
      title: 'Producto agregado al carrito',
      message: priceData.message, // "Inicia sesión para acceder a precios por volumen"
      actions: [
        { text: 'Iniciar Sesión', onClick: () => navigate('/login') },
        { text: 'Continuar Comprando', onClick: () => {} }
      ]
    });
    
    return { success: true, local: true, price: priceData };
  }
  
  // Usuario logueado: usar API normal
  const response = await fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: productId, variant_id: variantId, quantity })
  });
  
  return response.json();
};

// 2. Al hacer login: migrar carrito local al servidor
const migrateGuestCart = async (token: string) => {
  const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
  
  if (guestCart.length > 0) {
    for (const item of guestCart) {
      await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity
        })
      });
    }
    
    // Limpiar carrito local
    localStorage.removeItem('guest_cart');
    
    showNotification({
      type: 'success',
      message: '¡Bienvenida! Tus productos han sido agregados al carrito.'
    });
  }
};
```

### Componente de Notificación Sugerido

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Producto agregado al carrito</AlertDialogTitle>
      <AlertDialogDescription>
        <p>Precio base: ${unitPrice}</p>
        <p className="mt-2 text-amber-600 font-semibold">
          💡 Inicia sesión para acceder a precios por volumen y realizar tu compra
        </p>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction onClick={() => navigate('/login')}>
        Iniciar Sesión
      </AlertDialogAction>
      <AlertDialogCancel>Continuar Comprando</AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Mostrar Precios en Listado de Productos

```tsx
// Para usuarios no logueados, mostrar solo precio base
const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const [basePrice, setBasePrice] = useState(null);
  
  useEffect(() => {
    if (!user) {
      // Obtener precio base para invitados
      fetch('/cart/guest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      })
      .then(res => res.json())
      .then(data => setBasePrice(data.unit_price));
    }
  }, [user, product.id]);
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <img src={product.image_url} alt={product.name} />
      
      {!user && basePrice ? (
        <div>
          <p className="price">${basePrice}</p>
          <p className="text-sm text-gray-500">
            Precio base. <Link to="/login">Inicia sesión</Link> para mejores precios
          </p>
        </div>
      ) : (
        <p className="price">${product.wholesale_price}</p>
      )}
      
      <button onClick={() => addToCart(product.id)}>
        Agregar al Carrito
      </button>
    </div>
  );
};
```

## 📝 Resumen de APIs

### Para Usuarios Logueados
- `GET /cart` - Obtener carrito
- `GET /cart/summary` - Resumen con precios dinámicos según tiers
- `POST /cart/add` - Agregar al carrito (requiere auth)
- `PUT /cart/update/:product_id` - Actualizar cantidad
- `DELETE /cart/remove/:product_id` - Eliminar item
- `POST /cart/transfer` - Solicitar vendedora

### Para Usuarios NO Logueados
- `POST /cart/guest-price` - Calcular precio base (público)
- `POST /cart/add` - Retorna mensaje indicando que debe loguearse

## ✨ Beneficios de esta Implementación

1. ✅ **Mejor UX**: Usuarios pueden navegar y ver precios sin login
2. ✅ **Incentivo a registrarse**: Ver que hay mejores precios al loguearse
3. ✅ **No se pierden productos**: Carrito local se migra al loguearse
4. ✅ **Seguridad**: El servidor no crea carritos anónimos en BD
5. ✅ **Transparencia**: Usuario sabe que debe loguearse para finalizar

## 🚨 Consideraciones Importantes

- **No aplicar tiers progresivos** para usuarios no logueados (siempre tier base)
- **Deshabilitar "Solicitar Vendedora"** si no hay login
- **Mostrar llamado a acción** claro para que se registren/logueen
- **Migrar carrito local** al hacer login para no perder productos
