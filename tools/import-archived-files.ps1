$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dropFolder = Join-Path $repoRoot 'DROP_FILES_HERE'

$destinations = @{
  FullMotion = Join-Path $repoRoot 'archive/full-motion'
  LevelEditor = Join-Path $repoRoot 'archive/level-editor'
  Physics = Join-Path $repoRoot 'archive/physics'
  References = Join-Path $repoRoot 'assets/references'
  Blender = Join-Path $repoRoot 'assets/blender'
  Exports = Join-Path $repoRoot 'assets/exports'
  Unclassified = Join-Path $repoRoot 'archive/unclassified'
}

foreach ($path in $destinations.Values) {
  New-Item -ItemType Directory -Force -Path $path | Out-Null
}

$files = Get-ChildItem -LiteralPath $dropFolder -File | Where-Object { $_.Name -ne 'README.txt' }

if (-not $files) {
  Write-Host ''
  Write-Host 'No files were found in DROP_FILES_HERE.' -ForegroundColor Yellow
  Write-Host 'The folder will open now. Drag your downloaded files into it, then run IMPORT_FILES.bat again.'
  Start-Process explorer.exe $dropFolder
  exit 0
}

$copied = @()

foreach ($file in $files) {
  $lowerName = $file.Name.ToLowerInvariant()
  $extension = $file.Extension.ToLowerInvariant()
  $destinationFolder = $destinations.Unclassified

  if ($lowerName -eq 'hargold_mebble_full_motion_build_009.html' -or $lowerName -like '*full_motion*build*.html') {
    $destinationFolder = $destinations.FullMotion
  }
  elseif ($lowerName -like '*level_editor*.html' -or $lowerName -like '*level-editor*.html') {
    $destinationFolder = $destinations.LevelEditor
  }
  elseif ($lowerName -eq 'physics_completion_matrix.json' -or $lowerName -eq 'movement_spec.md' -or $lowerName -like '*physics*.json' -or $lowerName -like '*movement*spec*.md') {
    $destinationFolder = $destinations.Physics
  }
  elseif ($lowerName -eq 'hargold_mebble_full_motion_build_009_qa.json' -or $lowerName -like '*full_motion*qa*.json') {
    $destinationFolder = $destinations.FullMotion
  }
  elseif ($extension -eq '.blend') {
    $destinationFolder = $destinations.Blender
  }
  elseif ($extension -in @('.fbx', '.glb', '.gltf')) {
    $destinationFolder = $destinations.Exports
  }
  elseif ($extension -in @('.png', '.jpg', '.jpeg', '.webp') -and ($lowerName -like '*hargold*' -or $lowerName -like '*mebble*')) {
    $destinationFolder = $destinations.References
  }

  $destinationPath = Join-Path $destinationFolder $file.Name

  if (Test-Path -LiteralPath $destinationPath) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $timeStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $destinationPath = Join-Path $destinationFolder ($baseName + '-' + $timeStamp + $file.Extension)
  }

  Copy-Item -LiteralPath $file.FullName -Destination $destinationPath
  $copied += [PSCustomObject]@{
    File = $file.Name
    Destination = $destinationPath.Substring($repoRoot.Length + 1)
  }
}

$statusPath = Join-Path $repoRoot 'IMPORT_STATUS.txt'
$lines = @(
  'Hargold & Mebble import completed: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
  ''
)
$lines += $copied | ForEach-Object { $_.File + ' -> ' + $_.Destination }
$lines += @(
  '',
  'Codex instruction:',
  'Read AGENTS.md first, then inspect every file listed above. Do not replace current canon with obsolete archived values.'
)
Set-Content -LiteralPath $statusPath -Value $lines -Encoding UTF8

Write-Host ''
Write-Host 'Import complete.' -ForegroundColor Green
$copied | Format-Table -AutoSize
Write-Host ''
Write-Host 'Codex can now see the copied files inside the repository.'
Write-Host 'Tell Codex: Read AGENTS.md, then inspect IMPORT_STATUS.txt and the newly imported files.'
