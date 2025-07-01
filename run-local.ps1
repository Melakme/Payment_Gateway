# Payment Gateway Local Runner
Write-Host "🚀 Payment Gateway Local Runner" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`nChecking if Node.js is installed..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is available
Write-Host "`nChecking if npm is available..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is available: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available. Please install npm." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to start backend server
function Start-BackendServer {
    Write-Host "`nStarting backend server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node backend/server.js" -WindowStyle Normal
}

# Function to start frontend server
function Start-FrontendServer {
    Write-Host "Starting frontend development server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev:frontend" -WindowStyle Normal
}

# Start both servers
Start-BackendServer

# Wait a moment for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Start-FrontendServer

# Show success message
Write-Host "`n🎉 Payment Gateway is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔌 Backend API will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🏥 Health check: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""

# Ask user if they want to open the browser
$openBrowser = Read-Host "Do you want to open the application in your browser? (y/n)"
if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
    Write-Host "Opening application in browser..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
}

Write-Host "`n✅ Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Yellow
Write-Host "1. Close the PowerShell windows that opened" -ForegroundColor White
Write-Host "2. Or press Ctrl+C in each window" -ForegroundColor White
Write-Host ""
Write-Host "To test the cart integration:" -ForegroundColor Cyan
Write-Host "1. Login as customer: customer@example.com / password123" -ForegroundColor White
Write-Host "2. Go to 'Product Order' tab and add items to cart" -ForegroundColor White
Write-Host "3. Go to 'New Payment' tab - amount will auto-set to cart total" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit" 