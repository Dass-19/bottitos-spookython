# MantaZero CloudFront HTTPS Deployment Script
# Spookython 2026 Track B

param(
    [string]$OriginDomain = "mantazero-alb-994615840.us-east-1.elb.amazonaws.com"
)

Write-Host "============================================================"
Write-Host " MantaZero - CloudFront HTTPS Distribution Deployment"
Write-Host " Origin ALB: $OriginDomain"
Write-Host "============================================================"

$configPath = Join-Path $PSScriptRoot "cloudfront-distribution.json"
if (-not (Test-Path $configPath)) {
    Write-Error "No se encontro el archivo de configuracion: $configPath"
    exit 1
}

Write-Host "✓ Creando/Actualizando distribucion CloudFront..."
$res = aws cloudfront create-distribution --distribution-config "file://$configPath" | ConvertFrom-Json

$distId = $res.Distribution.Id
$domainName = $res.Distribution.DomainName
$status = $res.Distribution.Status

Write-Host "✓ Distribucion creada exitosamente!"
Write-Host "  Distribution ID: $distId"
Write-Host "  Domain Name:     https://$domainName"
Write-Host "  Status:          $status"
Write-Host "============================================================"
