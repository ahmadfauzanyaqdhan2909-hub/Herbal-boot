# v7la-core.ps1 -- UNIVERSAL V7LA CORE HUB (v1.7.0)
# Sourced in PowerShell Profile to enable global V7LA shortcuts.

# -- Konfigurasi Root --
$ScriptDir = $PSScriptRoot
if ($ScriptDir -like "*\bin" -or $ScriptDir -like "*/bin") {
    $DetectedRoot = Split-Path $ScriptDir -Parent
}
else {
    $DetectedRoot = $ScriptDir
}

if ($null -eq $V7LA_PROJECT_ROOT) { $V7LA_PROJECT_ROOT = $DetectedRoot }
$V7LA_CORE_ROOT = $V7LA_PROJECT_ROOT

# 1. Deteksi Portable Node Runtime
$PORTABLE_NODE = Join-Path $V7LA_CORE_ROOT "runtime\node.exe"
if (Test-Path $PORTABLE_NODE) {
    $NODE_EXE = $PORTABLE_NODE
}
else {
    $NODE_EXE = "node"
}

# 2. Localized MCP / Node Context
$env:V7LA_CORE_ROOT = $V7LA_CORE_ROOT
$env:V7LA_PROJECT_ROOT = $V7LA_PROJECT_ROOT
$env:V7LA_MCP_CONFIG = Join-Path $V7LA_CORE_ROOT "config\mcp"

# -- THE BRAIN --
function n { param([Parameter(ValueFromRemainingArguments = $true)]$Text) $t = $Text -join " "; & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_nexus_pipeline.js" $t }
function m { param([Parameter(ValueFromRemainingArguments = $true)]$Text) $t = $Text -join " "; $strat = "[STRATEGY ONLY] $t"; & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_nexus_pipeline.js" $strat }
function k { 
    param([Parameter(ValueFromRemainingArguments = $true)]$Text)
    $q = $Text -join " "
    if ($q -eq "sync") { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_sync_graph.js" }
    elseif ($q -eq "draft") { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_judge.js" list }
    elseif ($q -eq "s") { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_judge.js" ok all }
    else { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_explorer.js" $q }
}
function ks { k s }
function j { param($a, $i) & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_judge.js" $a $i }

# -- HEALTH --
function v { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_status.js" }
function l { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_layer_init.js" }
function 1 { l }
function c { l }

# -- ENGINE --
function d { & "$V7LA_CORE_ROOT\d.ps1" }
function a { param([Parameter(ValueFromRemainingArguments = $true)]$Text) $t = $Text -join " "; & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_nexus_pipeline.js" $t }
function q { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_drill.js" }

# -- VAULT --
function b { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_backup.js" }
function e { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_export_master.js" }
function r { & "$V7LA_CORE_ROOT\r.ps1" }
function i { param($m) & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_sync.js" $m }
function sd {
    param(
        [Parameter(Mandatory=$true, Position=0)][string]$Title,
        [Parameter(Mandatory=$true, Position=1)][string]$Desc
    )
    & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_sync_docs.js" $Title $Desc
}

# -- DISTRO --
function s { & "$V7LA_CORE_ROOT\V7LA-1-QUICK-SYNC.bat" }
function vpl-codespace { & "$V7LA_CORE_ROOT\vpl-codespace.ps1" }
function h { & "$V7LA_CORE_ROOT\V7LA-3-HEALTH-CHECK.bat" }
function build { & "$V7LA_CORE_ROOT\V7LA-2-FULL-DISTRO.bat" }
function v-port { param($p) & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_vport_factory.js" $p }
function vp { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_vport_bundle.js" }
function vpl { param($p) if ($null -ne $p) { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_cloudport.js" --project $p } else { & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_cloudport.js" } }
function vpl-zip { 
    param($p)
    vpl $p
    $suffix = if ($null -ne $p) { "-$p" } else { "" }
    $source = Join-Path $V7LA_CORE_ROOT "V7LA-CLOUDPORT-SUITE"
    $dest = Join-Path $V7LA_CORE_ROOT "V7LA-CLOUDPORT-LATEST$($suffix).zip"
    $tempDest = "$dest.tmp"
    
    Write-Host "Compressing Cloud Suite using .NET ZipFile (Atomic Staging)..." -ForegroundColor Cyan
    
    if (Test-Path $tempDest) { Remove-Item $tempDest -Force -ErrorAction SilentlyContinue }
    
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal
    
    try {
        $zip = [System.IO.Compression.ZipFile]::Open($tempDest, "Create")
        $files = [System.IO.Directory]::GetFiles($source, "*", "AllDirectories")
        
        foreach ($file in $files) {
            $relativePath = $file.Substring($source.Length + 1).Replace("\", "/")
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file, $relativePath, $compressionLevel)
        }
    }
    finally {
        if ($null -ne $zip) { $zip.Dispose() }
    }

    if (Test-Path $tempDest) {
        if (Test-Path $dest) { Remove-Item $dest -Force -ErrorAction SilentlyContinue }
        Move-Item -Path $tempDest -Destination $dest -Force
        
        Write-Host "DONE: ZIP Ready: $dest" -ForegroundColor Green
        if (Test-Path $dest) {
            $finalSize = [Math]::Round((Get-Item $dest).Length / 1MB, 2)
            Write-Host "SIZE: Final Payload Size: $finalSize MB" -ForegroundColor Cyan
        }
    }
}
function vpl-auto {
    param($p)
    vpl-zip $p
    Write-Host "Opening Google Drive for Upload..." -ForegroundColor Cyan
    Start-Process "https://drive.google.com/drive/my-drive"
    Write-Host "Please DROP the ZIP file into your browser." -ForegroundColor Yellow
}
function vpl-auto-fix { 
    param($p) 
    if ($null -ne $p -and (Test-Path "$V7LA_CORE_ROOT\$p")) {
        Push-Location "$V7LA_CORE_ROOT\$p"
        build-fix
        Pop-Location
    }
    else {
        build-fix
    }
    vpl-auto $p 
}
function vpl-colab { & $NODE_EXE "$V7LA_CORE_ROOT\bin\vpl-term.js" }
function vhelp { Get-V7LAHelp }
function vh { vhelp }


function rr { param([Parameter(ValueFromRemainingArguments = $true)]$Text) $t = $Text -join " "; & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_repair.js" $t }
function compose { param($f) & $NODE_EXE "$V7LA_CORE_ROOT\bin\v7la_composer.js" $f }
function start-pilot { Start-Job -ScriptBlock { & "$using:NODE_EXE" "$using:V7LA_CORE_ROOT\bin\v7la_watchdog.js" } }
function build-fix { npm run build; if ($LASTEXITCODE -ne 0) { rr "Build failed. Fix now." } }

function openclaw { param($c, $a, $t) & "$V7LA_CORE_ROOT\core\openclaw.ps1" $c $a $t }
function opencode { Set-Location "$V7LA_CORE_ROOT\opencode" }

function Get-V7LAHelp {
    $C = [char]::ConvertFromUtf32(0x2705)  # Check
    $M = "Magenta"; $Cy = "Cyan"; $B = "Blue"; $Y = "Yellow"; $G = "Green"; $Gy = "Gray"

    function Out-Row($cmd, $desc, $color) {
        $pCmd = $cmd.PadRight(12)
        $pDesc = $desc.PadRight(50)
        Write-Host " | " -NoNewline -ForegroundColor $Gy
        Write-Host "$C $pCmd" -NoNewline -ForegroundColor $color
        Write-Host " | " -NoNewline -ForegroundColor $Gy
        Write-Host "$pDesc" -NoNewline
        Write-Host " |" -ForegroundColor $Gy
    }

    function Out-Head($title, $color) {
        $pTitle = $title.PadRight(64).PadLeft(66)
        Write-Host " +--------------------------------------------------------------------+" -ForegroundColor $Gy
        Write-Host " |" -NoNewline -ForegroundColor $Gy
        Write-Host "$pTitle" -NoNewline -ForegroundColor $color -BackgroundColor Black
        Write-Host "|" -ForegroundColor $Gy
        Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy
    }

    Write-Host ""
    Write-Host " ====================== V7LA MASTER COMMANDS ====================== " -ForegroundColor $Gy -BackgroundColor DarkGray
    Write-Host ""

    # THE BRAIN
    Out-Head "THE BRAIN" $M
    Out-Row "n" "Nexus Pipeline - Alur kerja AI penuh." $G
    Out-Row "m" "Methodology - Merancang strategi." $G
    Out-Row "k (ks)" "Knowledge Ex - Cari Vault (ks = segel cepat)." $G
    Out-Row "j" "Nexus Judge - Menyetujui draft pengetahuan." $G
    Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy

    Write-Host ""
    # HEALTH
    Out-Head "HEALTH & PERSISTENCE" $Cy
    Out-Row "v" "View Dashboard - Tampilan status sistem." $G
    Out-Row "rr" "Auto-Repair - Perbaikan error otomatis." $G
    Out-Row "q" "Quad-Lock Drill - Verifikasi integritas data." $G
    Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy

    Write-Host ""
    # ENGINE
    Out-Head "ENGINE & PERFORMANCE" $B
    Out-Row "d" "Dev Mode - Aktivasi mode pengembangan." $G
    Out-Row "a" "Action - Tugas teknis spesifik." $G
    Out-Row "compose" "V7LA Composer - Menyusun file blueprint." $G
    Out-Row "1 / c" "Layer Init - Inisialisasi layer aplikasi." $G
    Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy

    Write-Host ""
    # VAULT
    Out-Head "VAULT & DATA" $Y
    Out-Row "b" "Backup - Backup database LanceDB instan." $G
    Out-Row "r" "Restore Master - Pemulihan data (seed_master)." $G
    Out-Row "e" "Export Master - Ekspor data vault migrasi." $G
    Out-Row "i" "Ingest - Menambah pengetahuan baru." $G
    Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy

    Write-Host ""
    # DISTRO
    Out-Head "DISTRO & CLOUD" $G
    Out-Row "s" "Quick Sync - Sinkronisasi cepat file." $G
    Out-Row "build" "Full Distro - Membuat paket ZIP distribusi." $G
    Out-Row "vpl" "CloudPort - Bundling Linux & Colab." $G
    Out-Row "vh / vhelp" "Help Menu - Menampilkan menu ini." $G
    Write-Host " +-------------+------------------------------------------------------+" -ForegroundColor $Gy
    Write-Host ""
}


Get-ChildItem -Directory -Path $V7LA_CORE_ROOT | ForEach-Object {
    $PkgPath = Join-Path $_.FullName "package.json"
    if (Test-Path $PkgPath) {
        $RawName = $_.Name
        $CleanName = $RawName -replace "^lms-", ""
        $ShortcutName = "vpl-auto-$CleanName"
        Set-Item -Path "function:global:$ShortcutName" -Value ([scriptblock]::Create("vpl-auto $RawName"))
        $FixShortcut = "vpl-auto-fix-$CleanName"
        Set-Item -Path "function:global:$FixShortcut" -Value ([scriptblock]::Create("vpl-auto-fix $RawName"))
    }
}

# Auto-run only if executed directly (not sourced)
if ($MyInvocation.InvocationName -ne "." -and $MyInvocation.InvocationName -ne ".." -and $null -ne $MyInvocation.InvocationName -and $MyInvocation.CommandLine -notlike "*vh*" -and $MyInvocation.CommandLine -notlike "*vhelp*") {
    if ($args.Count -eq 0) { Get-V7LAHelp }
}


