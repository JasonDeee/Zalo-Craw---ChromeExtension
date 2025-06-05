# Install Native Host for Windows

# Path to the native host directory
$nativeHostDir = "$PSScriptRoot\native-host"
$hostManifestPath = "$nativeHostDir\com.zalocrawler.host.json"

# Update the host path in the manifest
$hostPath = "$nativeHostDir\host.js"
$hostPath = $hostPath.Replace("\", "\\")

# Read the manifest content
$manifestContent = Get-Content -Path $hostManifestPath -Raw
$manifestContent = $manifestContent -replace 'HOST_PATH_WINDOWS', $hostPath

# Write the updated manifest back
Set-Content -Path $hostManifestPath -Value $manifestContent

# Register the native host
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.zalocrawler.host"
$registryValue = $hostManifestPath

# Create the registry key
New-Item -Path $registryPath -Force | Out-Null
Set-ItemProperty -Path $registryPath -Name '(Default)' -Value $registryValue -Type String

Write-Host "Native host has been installed successfully!" -ForegroundColor Green
Write-Host "Please restart Chrome for the changes to take effect."
