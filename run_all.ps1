# Analytix BI Service Launcher

Clear-Host
Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host "                Analytix BI Service Launcher" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host ""

$p1 = $null
$p2 = $null
$p3 = $null

try {
    Write-Host "[*] Starting Django API Backend Server (port 8000)..." -ForegroundColor Cyan
    $p1 = Start-Process cmd -ArgumentList '/k "title Django Backend Server && cd Backend && .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"' -PassThru

    Write-Host "[*] Starting Celery Background Task Runner (Worker)..." -ForegroundColor Cyan
    $p2 = Start-Process cmd -ArgumentList '/k "title Celery Task Worker && cd Backend && .\venv\Scripts\celery.exe -A config worker --loglevel=info -P threads"' -PassThru

    Write-Host "[*] Starting Vite React Frontend Dev Server..." -ForegroundColor Cyan
    $p3 = Start-Process cmd -ArgumentList '/k "title Vite React Frontend && cd Frontend\frontend && npm run dev"' -PassThru

    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "[OK] Services launched in separate background terminal windows!" -ForegroundColor Green
    Write-Host "    - Backend API Base: http://127.0.0.1:8000/api/v1/" -ForegroundColor Green
    Write-Host "    - Frontend Dashboard: http://localhost:5173/" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host ">>> Press Ctrl+C in THIS window to stop all services <<<" -ForegroundColor Red

    # Keep script running to listen for Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "[*] Interrupted! Terminating all associated terminal services..." -ForegroundColor Yellow
    
    if ($p1) {
        Write-Host "Killing Django Backend..." -ForegroundColor DarkGray
        taskkill /F /T /PID $p1.Id 2>$null
    }
    if ($p2) {
        Write-Host "Killing Celery Worker..." -ForegroundColor DarkGray
        taskkill /F /T /PID $p2.Id 2>$null
    }
    if ($p3) {
        Write-Host "Killing Vite Frontend..." -ForegroundColor DarkGray
        taskkill /F /T /PID $p3.Id 2>$null
    }
    
    Write-Host "[OK] All services stopped successfully." -ForegroundColor Green
}
