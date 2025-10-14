@echo off
echo ========================================
echo   MedCure - Deploy to Vercel
echo ========================================
echo.

echo Checking git status...
git status
echo.

echo ========================================
echo Ready to commit and push changes?
echo This will trigger automatic deployment on Vercel.
echo ========================================
echo.
set /p CONFIRM="Continue? (y/n): "

if /i "%CONFIRM%" neq "y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "fix: resolve React createContext/forwardRef errors by removing aggressive code splitting"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your changes have been pushed to GitHub.
echo Vercel should automatically deploy your site.
echo.
echo Check deployment status at:
echo https://vercel.com
echo.
echo Once deployed, verify:
echo   1. No console errors
echo   2. All pages load correctly
echo   3. Forms and modals work
echo   4. Toast notifications appear
echo.
echo See DEPLOYMENT_READY.md for more details.
echo.
pause
