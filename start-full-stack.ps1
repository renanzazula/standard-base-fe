[CmdletBinding()]
param(
    [ValidateSet('web', 'native')]
    [string]$FrontendMode = 'web',

    [string]$ApiUrl = 'http://localhost:8080',

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Quote-Single {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    return "'" + $Value.Replace("'", "''") + "'"
}

function Assert-PathExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Description not found: $Path"
    }
}

function Assert-CommandExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName,

        [Parameter(Mandatory = $true)]
        [string]$InstallHint
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Required command '$CommandName' was not found. $InstallHint"
    }
}

function Start-DevWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,

        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,

        [Parameter(Mandatory = $true)]
        [string[]]$Commands
    )

    $quotedTitle = Quote-Single -Value $Title
    $quotedWorkingDirectory = Quote-Single -Value $WorkingDirectory
    $scriptLines = @(
        '$ErrorActionPreference = ''Stop'''
        '$host.UI.RawUI.WindowTitle = ' + $quotedTitle
        'Set-Location -LiteralPath ' + $quotedWorkingDirectory
    ) + $Commands

    $startupScript = [string]::Join([Environment]::NewLine, $scriptLines)

    if ($DryRun) {
        Write-Host ''
        Write-Host "[$Title]" -ForegroundColor Cyan
        Write-Host "Directory: $WorkingDirectory"
        Write-Host $startupScript
        return
    }

    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($startupScript))
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $WorkingDirectory -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-EncodedCommand', $encodedCommand
    ) | Out-Null
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Join-Path $scriptRoot 'expo'
$backendRoot = Join-Path (Split-Path $scriptRoot -Parent) 'standard-base'

Assert-PathExists -Path $frontendRoot -Description 'Frontend directory'
Assert-PathExists -Path $backendRoot -Description 'Backend directory'
Assert-PathExists -Path (Join-Path $frontendRoot 'package.json') -Description 'Frontend package.json'
Assert-PathExists -Path (Join-Path $backendRoot 'pom.xml') -Description 'Backend pom.xml'

Assert-CommandExists -CommandName 'bun' -InstallHint 'Install Bun and make sure it is available on PATH.'
Assert-CommandExists -CommandName 'mvn' -InstallHint 'Install Maven and make sure it is available on PATH.'

$frontendCommand = if ($FrontendMode -eq 'web') { 'bun run start-web' } else { 'bun run start' }

Start-DevWindow -Title 'standard-base backend' -WorkingDirectory $backendRoot -Commands @(
    'Write-Host ''Starting Spring Boot backend...'' -ForegroundColor Green'
    'mvn spring-boot:run'
)

Start-Sleep -Seconds 2

Start-DevWindow -Title ("rork-standard-app frontend ({0})" -f $FrontendMode) -WorkingDirectory $frontendRoot -Commands @(
    '$env:EXPO_PUBLIC_API_URL = ' + (Quote-Single -Value $ApiUrl)
    'Write-Host (''EXPO_PUBLIC_API_URL='' + $env:EXPO_PUBLIC_API_URL) -ForegroundColor Green'
    ('Write-Host ''Starting Expo frontend ({0})...'' -ForegroundColor Green' -f $FrontendMode)
    $frontendCommand
)

if ($DryRun) {
    Write-Host ''
    Write-Host 'Dry run completed. No new PowerShell windows were started.' -ForegroundColor Yellow
}
else {
    Write-Host 'Started backend and frontend in separate PowerShell windows.' -ForegroundColor Green
}
