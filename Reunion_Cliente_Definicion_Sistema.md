# Reunión con Cliente – Definición de Sistema Web para Tienda de Ropa


## 1. Integración con Sistema Actual de Stock (Zoologic/Dragonfish)

**Contexto actual:**
- Zoologic se utiliza de manera local, sin conexión a la nube, en una computadora específica.
- El sistema no es administrado directamente por el cliente, sino por un tercero externo.
- No se dispone de información directa sobre APIs, integraciones o acceso a la base de datos.
- Los backups se realizan periódicamente de forma local.
- El sistema Zoologic no se usará para ventas ni para gestionar el stock relacionado a la web.

### Propuestas

#### A. Carga y gestión de stock en la web, con integración posterior hacia Zoologic (proceso inverso)
- **Ventajas:**
  - El stock y los movimientos se gestionan directamente en la web, con mayor control y flexibilidad.
  - No depende de la disponibilidad ni de la infraestructura de Zoologic para operar la tienda online.
  - Permite operar la web aunque Zoologic esté fuera de línea o inaccesible.
  - La integración con Zoologic puede realizarse de forma periódica (por lotes, exportación/importación manual, scripts, etc.), sin necesidad de tiempo real.
  - Menor complejidad técnica inicial, ya que no requiere integración directa ni acceso a APIs desconocidas.
- **Desventajas:**
  - Requiere definir un proceso claro para reflejar los movimientos de stock de la web en Zoologic (por ejemplo, exportar un archivo o generar reportes para el tercero que administra Zoologic).
  - Puede implicar una carga administrativa adicional si la integración no se automatiza.
  - Depende de la colaboración del tercero que administra Zoologic para definir el mecanismo de importación de datos.

#### B. Integración directa con Zoologic (si fuera posible en el futuro)
- **Ventajas:**
  - Permitiría sincronización automática de stock y productos entre ambos sistemas.
  - Menor riesgo de errores humanos por doble carga.
- **Desventajas:**
  - Requiere acceso técnico a la API o base de datos de Zoologic, lo cual actualmente no está disponible ni garantizado.
  - Mayor complejidad técnica y dependencia de un tercero.
  - Posibles costos adicionales y demoras por falta de documentación o soporte.

### Preguntas clave para el cliente
- ¿Quién es el contacto técnico del tercero que administra Zoologic?
- ¿Qué mecanismos de importación/exportación soporta Zoologic? (archivos, scripts, etc.)
- ¿Con qué frecuencia desean reflejar los movimientos de la web en Zoologic?
- ¿Quién será responsable de ejecutar la integración (el cliente, el tercero, ambos)?
- ¿Qué información mínima debe reflejarse en Zoologic (stock, productos, ventas)?

---

## 2. Catálogo y Gestión de Productos
- ¿Qué atributos debe tener cada producto? (nombre, descripción, precio, imágenes, variantes, etc.)
- ¿Cómo gestionan actualmente las variantes (talle, color, etc.)?
- ¿Desean importar el catálogo actual o crear uno nuevo?
- ¿Quién será responsable de cargar y mantener los productos?

## 3. Gestión de Usuarios y Roles
- ¿Qué tipos de usuarios habrá? (admin, vendedor, cliente, etc.)
- ¿Qué permisos específicos debe tener cada rol?
- ¿Desean permitir registro de clientes online?

## 4. Proceso de Ventas y Pedidos
- ¿El sistema será solo para ventas online, o también para ventas en local/físicas?
- ¿Qué métodos de pago desean habilitar? (efectivo, transferencia, tarjetas, MercadoPago, etc.)
- ¿Cómo gestionan actualmente los pedidos y el seguimiento de entregas?
- ¿Desean integración con sistemas de envío/logística?

## 5. Carrito y Experiencia de Compra
- ¿Qué pasos debe tener el proceso de compra?
- ¿Desean permitir compras como invitado?
- ¿Qué información debe solicitarse al cliente en la compra?

## 6. Reportes y Auditoría
- ¿Qué reportes necesitan? (ventas, stock, productos más vendidos, etc.)
- ¿Quién debe acceder a los reportes?
- ¿Desean auditoría de acciones de usuarios?

## 7. Imágenes y Multimedia
- ¿Cómo desean gestionar las imágenes de productos? (tamaño, cantidad, calidad)
- ¿Desean galería, zoom, videos, etc.?

## 8. Seguridad y Privacidad
- ¿Hay requisitos legales o de privacidad específicos?
- ¿Desean doble autenticación, recuperación de contraseña, etc.?

## 9. Escalabilidad y Futuro
- ¿Prevén crecimiento en cantidad de productos, usuarios o sucursales?
- ¿Desean que el sistema sea multi-sucursal o multi-depósito?
- ¿Qué funcionalidades “a futuro” les gustaría considerar?

## 10. Diseño y Experiencia de Usuario
- ¿Tienen referencias de páginas que les gusten?
- ¿Desean un diseño personalizado o algo estándar?
- ¿Qué dispositivos usan más sus clientes? (móvil, desktop)

---

> **Sugerencia:** Llevar este documento a la reunión y completarlo junto al cliente. Agregar notas y decisiones en cada sección.
