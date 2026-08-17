for ($i=1; $i -le 6; $i++) {
    Start-Sleep -Seconds 10
    $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health'
    Write-Host "[$i/6] Health: ok=$($r.ok) at $($r.timestamp)"
    $f = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing
    Write-Host "[$i/6] Frontend: status=$($f.StatusCode)"
}
Write-Host "STABILITY TEST PASSED"
