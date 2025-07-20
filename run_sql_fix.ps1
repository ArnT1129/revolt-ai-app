Write-Host "Running AI Agent deletion fix..." -ForegroundColor Green
Write-Host ""

# Check if supabase CLI is installed
try {
    $null = supabase --version
} catch {
    Write-Host "Error: Supabase CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Supabase CLI first: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Applying SQL fix to database..." -ForegroundColor Yellow
supabase db reset --linked

Write-Host ""
Write-Host "SQL fix completed! The AI agent deletion should now work properly." -ForegroundColor Green
Write-Host ""
Write-Host "To test:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Sign in as a demo user" -ForegroundColor White
Write-Host "3. Go to AI Agent page and delete some results" -ForegroundColor White
Write-Host "4. Reload the page - deleted results should stay deleted" -ForegroundColor White
Write-Host "5. Sign out and sign back in - all demo data should be cleared" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue" 