@echo off
cd /d "%~dp0"
echo Starting Smart Procurement Management...
echo.
echo Prerequisites: Java 21+, MySQL running with database procurement_db
echo Default admin: admin / admin123
echo App URL: http://localhost:8080/
echo.
call mvnw.cmd spring-boot:run -DskipTests
pause
