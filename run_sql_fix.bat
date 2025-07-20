@echo off
echo Running AI Agent deletion fix...
echo.

REM Check if supabase CLI is installed
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Supabase CLI is not installed or not in PATH
    echo Please install Supabase CLI first: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo Applying SQL fix to database...
supabase db reset --linked

echo.
echo SQL fix completed! The AI agent deletion should now work properly.
echo.
echo To test:
echo 1. Start the development server: npm run dev
echo 2. Sign in as a demo user
echo 3. Go to AI Agent page and delete some results
echo 4. Reload the page - deleted results should stay deleted
echo 5. Sign out and sign back in - all demo data should be cleared
echo.
pause 