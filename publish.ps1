$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\bin\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repoPath = $PSScriptRoot
$repoName = "present-progressive-site"

Set-Location $repoPath

Write-Host "Checking GitHub login..." -ForegroundColor Cyan
& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not logged in. Opening GitHub login..." -ForegroundColor Yellow
  & $gh auth login --hostname github.com --git-protocol https --web
}

Write-Host "Creating repo and pushing to github.com/ofirx/$repoName ..." -ForegroundColor Cyan
$remotes = & $git remote 2>$null
if ($remotes -contains "origin") {
  & $git push -u origin main
} else {
  & $gh repo create $repoName --public --source=. --remote=origin --push
}

Write-Host ""
Write-Host "Done! Enable GitHub Pages:" -ForegroundColor Green
Write-Host "https://github.com/ofirx/$repoName/settings/pages"
Write-Host "Branch: main  |  Folder: / (root)"
Write-Host ""
Write-Host "Your site will be at:" -ForegroundColor Green
Write-Host "https://ofirx.github.io/$repoName/"
