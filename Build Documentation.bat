@echo off

rem Temporarily add our Cygwin path to PATH
set PATH=%PATH%;C:\cygwin\bin

rem Set Cygwin's home directory to the full path of the batch file
set HOME=%~dp0%

rem Run Docco on each of our folders of source code
bash.exe -login -c "docco -o docco *.js"
bash.exe -login -c "docco -o docco\\\\client client/*.js"
bash.exe -login -c "docco -o docco\\\\shared shared/*.js"
bash.exe -login -c "docco -o docco\\\\server server/*.js"
bash.exe -login -c "docco -o docco\\\\server\\\\gameLogic server/gameLogic/*.js"

rem Let us see the results before killing the command line argument
pause