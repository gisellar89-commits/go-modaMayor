Instrucciones rápidas para usar Postman con este proyecto

1) Importar la colección
- Abre Postman > Import > File > selecciona `postman_collection_go-modaMayor.json`.

2) Variables de entorno
- Crea un Environment y añade las variables:
  - base_url = http://localhost:8080
  - token = <tu JWT admin aquí>
  - payload_product_full = (puedes pegar aquí el contenido de `payload_product_full.json`)

Nota: la colección incluye `payload_product_full` como variable. Alternativamente, selecciona el request "Create Product Full" y pega el JSON en el body (raw) directamente.

3) Ejecutar Create Product Full
- Selecciona la colección y el request "Create Product Full".
- Asegúrate de seleccionar el Environment creado en la esquina superior derecha.
- Si no pegaste la carga en la variable `payload_product_full`, abre el request y pega el JSON en Body > raw.
- Ejecuta y revisa la respuesta. Deberías obtener 201 si todo está bien.

4) Debug
- Si recibes 401/403: revisa que `token` sea correcto y no tenga comillas extras.
- Si recibes 400/422: revisa que `category_id`, `subcategory_id` y `location_id` existan en la BD.
- Revise logs del servidor para traza completa: corre `go run cmd/main.go` en el repo y observa la salida.

5) Opcional: agregar tests en Postman
- En la pestaña Tests del request "Create Product Full" pega el siguiente script para guardar el `product.id` en la variable `product_id`:

```javascript
try {
  const json = pm.response.json();
  if (json && json.id) {
    pm.environment.set("product_id", json.id);
    pm.test("product id guardado", () => pm.expect(json.id).to.be.a("number"));
  }
} catch (e) {
  pm.test("respuesta JSON válida", () => pm.expect(pm.response.text()).to.include("{"));
}
```

6) Próximos pasos
- Probar endpoints de ventas: GET /orders, PUT /orders/:id/status (ajustar path según el backend).
- Probar endpoints de carrito con token de usuario.

Si quieres, puedo generar también una colección más completa con requests para cambiar estado de pedidos y ejemplos de tests automatizados. Dime si prefieres eso y confirmaré los paths exactos (puedo leer `internal/order/handler.go` para extraer rutas concretas).