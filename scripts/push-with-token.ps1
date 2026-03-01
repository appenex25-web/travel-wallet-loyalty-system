# Push to GitHub using GITHUB_TOKEN (so the agent can push without SSH).
# 1. Create a token: GitHub → Settings → Developer settings → Personal access tokens → Generate (classic), scope: repo
# 2. Set it once: [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'YOUR_TOKEN_HERE', 'User')
# 3. Restart Cursor/terminal so it sees the variable. Then we can run: .\scripts\push-with-token.ps1

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Host "GITHUB_TOKEN is not set. Set it with: [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'your_token', 'User')" -ForegroundColor Yellow
  exit 1
}

$remote = "https://${token}@github.com/appenex25-web/travel-wallet-loyalty-system.git"
$branch = "main"

Push-Location $PSScriptRoot\..
git push $remote $branch
Pop-Location
