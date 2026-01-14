$port = 3000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($tcp) {
    # Get all unique PIDs, excluding 0 (System Idle)
    $pidsToKill = $tcp | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | Where-Object { $_ -gt 0 }
    
    if ($pidsToKill) {
        foreach ($pidVal in $pidsToKill) {
            Write-Host "Found process $pidVal usage on port $port. Killing..."
            try {
                Stop-Process -Id $pidVal -Force -ErrorAction Stop
                Write-Host "Process $pidVal terminated."
            } catch {
                Write-Host "Failed to stop process $pidVal : $_"
            }
        }
    } else {
        Write-Host "No user process found on port $port (only system/idle)."
    }
} else {
    Write-Host "No process found searching on port $port."
}
