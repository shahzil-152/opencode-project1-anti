@echo off
REM Starts the local MongoDB used by TaskFlow, if it isn't already running.
setlocal

set MONGO_HOME=%USERPROFILE%\mongodb
set DB_DIR=%MONGO_HOME%\data\db
set LOG_FILE=%MONGO_HOME%\log\mongod.log

if not exist "%MONGO_HOME%\bin\mongod.exe" (
  echo [taskflow] mongod.exe not found under %MONGO_HOME%.
  echo [taskflow] Expected the portable MongoDB extracted there ^(see README^).
  exit /b 1
)

REM Already running? Then we're done.
powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 27017); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
  echo [taskflow] MongoDB is already running on port 27017.
  exit /b 0
)

if not exist "%DB_DIR%" mkdir "%DB_DIR%"
if not exist "%MONGO_HOME%\log" mkdir "%MONGO_HOME%\log"

echo [taskflow] Starting MongoDB (data: %DB_DIR%)...
REM Start-Process detaches mongod fully so it keeps running after this window closes.
powershell -NoProfile -Command "Start-Process -FilePath '%MONGO_HOME%\bin\mongod.exe' -ArgumentList '--dbpath','%DB_DIR%','--logpath','%LOG_FILE%','--bind_ip','127.0.0.1','--port','27017' -WindowStyle Hidden"

REM Wait for the port to accept connections (up to 15s).
powershell -NoProfile -Command "for ($i = 0; $i -lt 30; $i++) { try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 27017); $c.Close(); exit 0 } catch { Start-Sleep -Milliseconds 500 } }; exit 1" >nul 2>&1
if %errorlevel%==0 (
  echo [taskflow] MongoDB is up on mongodb://127.0.0.1:27017/taskflow
) else (
  echo [taskflow] MongoDB did not come up within 15s - check %LOG_FILE%
  exit /b 1
)
endlocal
