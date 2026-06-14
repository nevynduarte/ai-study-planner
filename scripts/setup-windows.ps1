# ─────────────────────────────────────────────────────────────
# One-time Windows setup for the P620.
# Registers 3 scheduled tasks that run the bash scripts via Git Bash.
# Run:  powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
# Times are local (Eastern). Tasks run only while you are logged on
# (a locked session still counts as logged on).
# ─────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"

$bash = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path $bash)) { Write-Error "Git Bash not found at $bash"; exit 1 }

# Project root (parent of this script's folder), converted to a Git-Bash path (/c/...)
$projWin  = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$drive    = $projWin.Substring(0, 1).ToLower()
$projBash = "/$drive" + $projWin.Substring(2).Replace("\", "/")

$user      = "$env:USERDOMAIN\$env:USERNAME"
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited

function Register-Job($name, $script, $trigger, $desc) {
  # Run via conhost --headless so Node/wrangler get a console (otherwise they hit
  # a libuv assertion under Task Scheduler), with WorkingDirectory set to the
  # project so wrangler's .wrangler cache writes somewhere writable (the default
  # task CWD is C:\Windows\system32, which is read-only -> EPERM).
  $arg    = "--headless `"$bash`" -lc `"bash $projBash/scripts/$script`""
  $action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument $arg -WorkingDirectory $projWin
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal -Description $desc -Force | Out-Null
  Write-Host "Registered: $name"
}

# 6am daily — briefing + plan + frontier
$tBrief = New-ScheduledTaskTrigger -Daily -At 6:00am
Register-Job "AIStudyPlanner-Briefing" "daily-briefing.sh" $tBrief "Daily 6am: SMS briefing + plan + frontier -> D1"

# hourly — answer tutor questions (10-year repetition = effectively indefinite)
$tHourly = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
  -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
Register-Job "AIStudyPlanner-Tutor" "answer-questions.sh" $tHourly "Hourly: answer tutor questions -> D1"

# 11pm daily — advisory
$tAdv = New-ScheduledTaskTrigger -Daily -At 11:00pm
Register-Job "AIStudyPlanner-Advisory" "advisory.sh" $tAdv "Nightly 11pm: plan health advisory -> D1"

Write-Host ""
Write-Host "Done. Manage in Task Scheduler -> Task Scheduler Library -> AIStudyPlanner-*"
Write-Host "Test now:  bash scripts/daily-briefing.sh"
