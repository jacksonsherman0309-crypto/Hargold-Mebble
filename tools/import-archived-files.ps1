$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dropFolder = Join-Path $repoRoot 'DROP_FILES_HERE'
$archiveRoot = Join-Path $repoRoot 'archive/imported-packages'
$timeStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageRoot = Join-Path $archiveRoot $timeStamp
$sourceZipRoot = Join-Path $packageRoot '_source-zips'
$expandedZipRoot = Join-Path $packageRoot 'expanded-zips'
$looseFileRoot = Join-Path $packageRoot 'loose-files'

New-Item -ItemType Directory -Force -Path $dropFolder | Out-Null
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$entries = Get-ChildItem -LiteralPath $dropFolder -Force | Where-Object { $_.Name -ne 'README.txt' }

if (-not $entries) {
  Write-Host ''
  Write-Host 'No files or folders were found in DROP_FILES_HERE.' -ForegroundColor Yellow
  Write-Host 'The folder will open now. Drag downloaded files, folders, or ZIP packages into it, then run IMPORT_FILES.bat again.'
  Start-Process explorer.exe $dropFolder
  exit 0
}

New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null
$importNotes = @()

foreach ($entry in $entries) {
  if ($entry.PSIsContainer) {
    $destination = Join-Path $packageRoot $entry.Name
    Copy-Item -LiteralPath $entry.FullName -Destination $destination -Recurse -Force
    $importNotes += "Folder preserved: $($entry.Name) -> archive/imported-packages/$timeStamp/$($entry.Name)"
    continue
  }

  if ($entry.Extension.ToLowerInvariant() -eq '.zip') {
    New-Item -ItemType Directory -Force -Path $sourceZipRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $expandedZipRoot | Out-Null

    $zipCopy = Join-Path $sourceZipRoot $entry.Name
    Copy-Item -LiteralPath $entry.FullName -Destination $zipCopy -Force

    $expandedFolderName = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name)
    $expandedDestination = Join-Path $expandedZipRoot $expandedFolderName
    New-Item -ItemType Directory -Force -Path $expandedDestination | Out-Null
    Expand-Archive -LiteralPath $entry.FullName -DestinationPath $expandedDestination -Force

    $importNotes += "ZIP preserved and expanded: $($entry.Name) -> archive/imported-packages/$timeStamp/expanded-zips/$expandedFolderName"
    continue
  }

  New-Item -ItemType Directory -Force -Path $looseFileRoot | Out-Null
  $destination = Join-Path $looseFileRoot $entry.Name
  Copy-Item -LiteralPath $entry.FullName -Destination $destination -Force
  $importNotes += "File preserved: $($entry.Name) -> archive/imported-packages/$timeStamp/loose-files/$($entry.Name)"
}

$importedFiles = Get-ChildItem -LiteralPath $packageRoot -File -Recurse | Sort-Object FullName
$relativeFiles = $importedFiles | ForEach-Object {
  $_.FullName.Substring($repoRoot.Length + 1).Replace('\', '/')
}

$statusPath = Join-Path $repoRoot 'IMPORT_STATUS.txt'
$latestPath = Join-Path $archiveRoot 'LATEST_IMPORT.txt'

$statusLines = @(
  'Hargold & Mebble world-specific archive import completed: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
  'Imported package root: archive/imported-packages/' + $timeStamp,
  'Imported file count: ' + $importedFiles.Count,
  '',
  'Import actions:'
)
$statusLines += $importNotes
$statusLines += @(
  '',
  'Imported files:'
)
$statusLines += $relativeFiles
$statusLines += @(
  '',
  'Codex instruction:',
  'Read AGENTS.md and docs/world-specific-archive-policy.md first. Then inspect this entire imported package, not only summary files.',
  'Treat every world and level as authored, world-specific content. Do not flatten the archive into a universal level template.',
  'Current canon overrides conflicting historical names, but reusable code, mechanics, enemy behavior, encounter data, and boss logic must be preserved and realigned rather than discarded.'
)

Set-Content -LiteralPath $statusPath -Value $statusLines -Encoding UTF8
Set-Content -LiteralPath $latestPath -Value @(
  'Latest imported package: archive/imported-packages/' + $timeStamp,
  'File count: ' + $importedFiles.Count,
  'See repository-root IMPORT_STATUS.txt for the complete inventory.'
) -Encoding UTF8

Write-Host ''
Write-Host 'World-specific archive import complete.' -ForegroundColor Green
Write-Host "Package: archive/imported-packages/$timeStamp"
Write-Host "Files imported: $($importedFiles.Count)"
Write-Host ''
Write-Host 'Original files remain in DROP_FILES_HERE. Nothing was deleted.'
Write-Host 'Codex can now inspect the preserved package structure, world plans, level plans, mob systems, and boss files.'
Write-Host ''
Write-Host 'Tell Codex: Read AGENTS.md, docs/world-specific-archive-policy.md, and IMPORT_STATUS.txt. Then inventory the entire imported package before changing code.'
