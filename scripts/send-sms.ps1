# Sends the daily briefing as a text via SMTP -> T-Mobile email-to-SMS gateway.
# Reads SMTP settings from config/smtp.local.json (gitignored).
# Called by scripts/lib.sh send_sms() on Windows.
param([Parameter(Mandatory = $true)][string]$BodyFile)
$ErrorActionPreference = "Stop"

$cfgPath = Join-Path $PSScriptRoot "..\config\smtp.local.json"
if (-not (Test-Path $cfgPath)) {
  Write-Error "Missing $cfgPath - copy config/smtp.example.json to config/smtp.local.json and fill it in."
  exit 1
}

$cfg  = Get-Content $cfgPath -Raw | ConvertFrom-Json
$body = Get-Content $BodyFile -Raw

$sec  = ConvertTo-SecureString $cfg.pass -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($cfg.user, $sec)

$params = @{
  SmtpServer = $cfg.host
  Port       = [int]$cfg.port
  UseSsl     = $true
  Credential = $cred
  From       = $cfg.from
  To         = $cfg.to
  Subject    = "AI Study Briefing"
  Body       = $body
}

Send-MailMessage @params
