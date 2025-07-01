# Payment Gateway Docker Runner for Windows
Write-Host "🚀 Payment Gateway Docker Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Function to show usage
function Show-Usage {
    Write-Host "Usage: .\docker-run.ps1 [dev|prod|stop|clean]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  dev   - Start in development mode (frontend + backend)" -ForegroundColor Green
    Write-Host "  prod  - Start in production mode (optimized)" -ForegroundColor Green
    Write-Host "  stop  - Stop all containers" -ForegroundColor Red
    Write-Host "  clean - Stop and remove all containers and images" -ForegroundColor Red
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\docker-run.ps1 dev    # Start development mode" -ForegroundColor Gray
    Write-Host "  .\docker-run.ps1 prod   # Start production mode" -ForegroundColor Gray
    Write-Host "  .\docker-run.ps1 stop   # Stop containers" -ForegroundColor Gray
}

# Function to start development mode
function Start-Dev {
    Write-Host "🔧 Starting Payment Gateway in DEVELOPMENT mode..." -ForegroundColor Green
    Write-Host "📱 Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "🔌 Backend API will be available at: http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    
    docker-compose --profile dev up --build
}

# Function to start production mode
function Start-Prod {
    Write-Host "🚀 Starting Payment Gateway in PRODUCTION mode..." -ForegroundColor Green
    Write-Host "🌐 Application will be available at: http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    
    docker-compose --profile prod up --build -d
    Write-Host "✅ Production container started in background" -ForegroundColor Green
    Write-Host "📊 Check logs with: docker-compose --profile prod logs -f" -ForegroundColor Yellow
}

# Function to stop containers
function Stop-Containers {
    Write-Host "🛑 Stopping Payment Gateway containers..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Containers stopped" -ForegroundColor Green
}

# Function to clean everything
function Clean-All {
    Write-Host "🧹 Cleaning up Payment Gateway containers and images..." -ForegroundColor Yellow
    docker-compose down --rmi all --volumes --remove-orphans
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Check if Docker is installed
try {
    $null = Get-Command docker -ErrorAction Stop
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $null = Get-Command docker-compose -ErrorAction Stop
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Main script logic
$command = $args[0]

switch ($command) {
    "dev" {
        Start-Dev
    }
    "prod" {
        Start-Prod
    }
    "stop" {
        Stop-Containers
    }
    "clean" {
        Clean-All
    }
    default {
        Show-Usage
        exit 1
    }
} 