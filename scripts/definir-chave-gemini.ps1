# Grava a chave do Gemini no .env.local sem exibi-la na tela.
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\definir-chave-gemini.ps1

$seguro = Read-Host "Cole a chave do Gemini (ela nao aparece na tela) e aperte Enter" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
try {
    $chave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr).Trim()
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ($chave.Length -lt 20) {
    Write-Host "A chave parece incompleta ($($chave.Length) caracteres). Nada foi alterado." -ForegroundColor Yellow
    exit 1
}

$arquivo = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
if (-not (Test-Path $arquivo)) {
    Write-Host "Arquivo .env.local nao encontrado em $arquivo" -ForegroundColor Red
    exit 1
}

$achou = $false
$linhas = Get-Content $arquivo | ForEach-Object {
    if ($_ -match '^GEMINI_API_KEY=') { $achou = $true; "GEMINI_API_KEY=$chave" } else { $_ }
}
if (-not $achou) { $linhas += "GEMINI_API_KEY=$chave" }

# UTF-8 sem BOM, para o Next.js ler corretamente.
[IO.File]::WriteAllLines((Resolve-Path $arquivo), [string[]]$linhas, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Pronto! Chave do Gemini salva no .env.local ($($chave.Length) caracteres)." -ForegroundColor Green
