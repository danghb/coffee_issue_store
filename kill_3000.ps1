$port = 3000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($tcp) {
    $pidToKill = $tcp.OwningProcess
    Write-Host "Found process $pidToKill listening on port $port. Killing..."
    Stop-Process -Id $pidToKill -Force
    Write-Host "Process terminated."
} else {
    Write-Host "No process found searching on port $port."
}
