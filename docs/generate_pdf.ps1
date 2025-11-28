<#
  Script PowerShell para generar un PDF desde el HTML con Google Chrome/Chromium instalado.
  Uso: .\generate_pdf.ps1 -Input .\presupuesto_para_cliente.html -Output .\presupuesto_cliente.pdf
#>
param(
  [string]$Input = "presupuesto_para_cliente.html",
  [string]$Output = "presupuesto_para_cliente.pdf"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$inputPath = Join-Path $scriptDir $Input
$outputPath = Join-Path $scriptDir $Output

Write-Host "Input: $inputPath"
Write-Host "Output: $outputPath"

# Buscar chrome en ubicaciones comunes
$possible = @( 
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
)

$chrome = $possible | Where-Object { Test-Path $_ } | Select-Object -First 1
if(-not $chrome){
  Write-Error "No se encontró Chrome/Edge en rutas comunes. Abra el HTML en un navegador y use 'Imprimir -> Guardar como PDF' como alternativa."
  exit 1
}

# Ejecutar en modo headless para generar pdf
$uri = (Resolve-Path $inputPath).ProviderPath
$uri = "file:///" + ($uri -replace '\\','/')

$arguments = "--headless --disable-gpu --print-to-pdf=\"$outputPath\" --no-margins \"$uri\""
Write-Host "Ejecutando: $chrome $arguments"
& $chrome $arguments

if(Test-Path $outputPath){
  Write-Host "PDF generado: $outputPath"
}else{
  Write-Error "Falló la generación del PDF. Intente abrir el HTML en el navegador y usar Imprimir -> Guardar como PDF."
}
