Presupuesto — generar PDF

Archivos generados en esta carpeta:
- `presupuesto_para_cliente.html` — versión imprimible del presupuesto (listo para abrir en navegador).
- `generate_pdf.ps1` — script PowerShell que intenta usar Chrome/Edge en modo headless para exportar a PDF.

Cómo generar el PDF (opciones):

1) Abrir en navegador y usar imprimir (recomendado y sencillo)
   - Doble clic en `presupuesto_para_cliente.html` para abrirlo en el navegador.
   - Archivo -> Imprimir -> "Guardar como PDF" o "Microsoft Print to PDF".

2) Usar el script PowerShell (requiere Chrome o Edge instalado):

```powershell
cd docs
.\generate_pdf.ps1 -Input .\presupuesto_para_cliente.html -Output .\presupuesto_cliente.pdf
```

El script busca Chrome/Edge en rutas comunes. Si su instalación está en otra ruta, modifique la variable `$possible` dentro del script.

Notas:
- El HTML está formateado para impresión con estilos CSS; debería producir un PDF listo para presentar.
- Si quieres, genero yo el PDF si me indicas que permita intentar convertirlo desde aquí (necesitaría confirmar que está OK ejecutar el script en tu entorno o que instale herramientas).