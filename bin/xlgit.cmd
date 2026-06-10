@echo off
setlocal
for %%I in (%~dp0..) do set ROOT=%%~fI
bun run "%ROOT%\packages\cli\index.ts" %*