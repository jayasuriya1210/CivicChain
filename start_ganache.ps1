# start_ganache.ps1 - frees port 7545 then starts Ganache CLI

$port = 7545

# kill any process listening on the port
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    $pid = $connections.OwningProcess
    Write-Host "Killing process $pid on port $port..."
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Starting Ganache on port $port..."
ganache-cli --host 127.0.0.1 --port $port --network-id 5777 --deterministic
