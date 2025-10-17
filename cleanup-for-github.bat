@echo off
echo Cleaning up files for GitHub deployment...
echo.

REM Delete test files
if exist "simple-test.html" del "simple-test.html" && echo Deleted: simple-test.html
if exist "test.html" del "test.html" && echo Deleted: test.html
if exist "working.html" del "working.html" && echo Deleted: working.html

REM Delete local development files
if exist "start-local.bat" del "start-local.bat" && echo Deleted: start-local.bat
if exist "build-config.js" del "build-config.js" && echo Deleted: build-config.js
if exist "package-lock.json" del "package-lock.json" && echo Deleted: package-lock.json
if exist ".nvmrc" del ".nvmrc" && echo Deleted: .nvmrc

REM Delete platform-specific files
if exist "_headers" del "_headers" && echo Deleted: _headers
if exist "_redirects" del "_redirects" && echo Deleted: _redirects
if exist "netlify.toml" del "netlify.toml" && echo Deleted: netlify.toml
if exist "vercel.json" del "vercel.json" && echo Deleted: vercel.json

REM Delete file with hardcoded API keys
if exist "env-config.example.js" del "env-config.example.js" && echo Deleted: env-config.example.js

REM Delete directories
if exist "api" rmdir /s /q "api" && echo Deleted: api folder
if exist "netlify" rmdir /s /q "netlify" && echo Deleted: netlify folder

REM Delete this cleanup script itself
if exist "cleanup-for-github.bat" del "cleanup-for-github.bat" && echo Deleted: cleanup script

echo.
echo Cleanup complete! Your project is now ready for GitHub.
echo.
echo Files remaining:
dir /b
pause