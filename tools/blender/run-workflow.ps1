param(
    [ValidateSet("CreateTemplate", "Validate", "Export")]
    [string]$Task = "CreateTemplate",
    [string]$BlendFile = "",
    [string]$BlenderExecutable = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
    [string]$ExportPath = ""
)

$ErrorActionPreference = "Stop"
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$templatePath = Join-Path $repositoryRoot "assets\blender\gameplay_asset_template.blend"

if (-not (Test-Path -LiteralPath $BlenderExecutable -PathType Leaf)) {
    throw "Blender executable not found: $BlenderExecutable"
}

switch ($Task) {
    "CreateTemplate" {
        & $BlenderExecutable --background --factory-startup --python-exit-code 1 `
            --python (Join-Path $PSScriptRoot "create_asset_template.py")
    }
    "Validate" {
        $sourcePath = if ($BlendFile) { $BlendFile } else { $templatePath }
        & $BlenderExecutable --background $sourcePath --python-exit-code 1 `
            --python (Join-Path $PSScriptRoot "validate_asset.py")
    }
    "Export" {
        $sourcePath = if ($BlendFile) { $BlendFile } else { $templatePath }
        $arguments = @(
            "--background", $sourcePath,
            "--python-exit-code", "1",
            "--python", (Join-Path $PSScriptRoot "export_gameplay.py")
        )
        if ($ExportPath) {
            $arguments += @("--", "--output", $ExportPath)
        }
        & $BlenderExecutable @arguments
    }
}

if ($LASTEXITCODE -ne 0) {
    throw "Blender workflow failed with exit code $LASTEXITCODE."
}
