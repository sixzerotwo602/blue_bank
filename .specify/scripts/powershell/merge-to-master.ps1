<#
.SYNOPSIS
    master 브랜치보다 앞서 있는(Ahead) 브랜치들을 감지하고, 선택적으로 병합하는 스크립트입니다.

.DESCRIPTION
    1. 로컬 master 브랜치를 최신화합니다 (git pull).
    2. 로컬 브랜치 중 master에 포함되지 않은 커밋이 있는 브랜치 목록을 보여줍니다.
    3. 사용자가 선택한 브랜치(또는 현재 브랜치)를 master로 병합하고 푸시합니다.

.EXAMPLE
    .\merge-to-master.ps1
#>

# 한글 인코딩 설정 (UTF-8)

# PowerShell 5.1 및 Core 호환성 확보
$OutputEncoding = [System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8


Write-Host "🔍 브랜치 상태 분석 중..." -ForegroundColor Cyan

# 0. 작업 트리 상태 확인 (추적 중인 파일의 변경사항만 확인 / Untracked 파일 무시)
$status = git status --porcelain --untracked-files=no
if ($status) {
    Write-Host "⚠️  작업 트리에 변경사항(Tracked files)이 있습니다. 커밋하거나 스태시(Stash) 후 실행해주세요." -ForegroundColor Red
    exit
}

# 1. Master 최신화
Write-Host "🔄 Master 브랜치 최신화 중..." -ForegroundColor Gray
$currentBranch = git branch --show-current
if ($currentBranch -ne "master") {
    git checkout master | Out-Null
}
git pull origin master | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Master 브랜치 업데이트 실패." -ForegroundColor Red
    exit
}

# 2. 앞서 있는 브랜치(Ahead Branches) 탐색
$branches = git branch --format="%(refname:short)"
$candidates = @()

foreach ($branch in $branches) {
    if ($branch -eq "master") { continue }
    
    # master..branch 사이에 커밋이 있는지 확인
    $count = git rev-list --count master..$branch
    if ([int]$count -gt 0) {
        $msg = git log -1 --format="%s" $branch
        $candidates += [PSCustomObject]@{
            Branch = $branch
            CommitsAhead = $count
            LastCommit = $msg
        }
    }
}

# 3. 결과 표시 및 선택
if ($candidates.Count -eq 0) {
    Write-Host "✅ 병합할 변경사항이 있는 브랜치가 없습니다. (All branches contain commits merged to master)" -ForegroundColor Green
    # 원래 브랜치로 복귀
    if ($currentBranch -ne "master") { git checkout $currentBranch | Out-Null }
    exit
}

Write-Host "`n🚀 병합 가능한 브랜치 목록 (Ahead of Master):" -ForegroundColor Cyan
for ($i = 0; $i -lt $candidates.Count; $i++) {
    $c = $candidates[$i]
    Write-Host " [$i] $($c.Branch) " -NoNewline -ForegroundColor Yellow
    Write-Host "(+$($c.CommitsAhead) commits)" -ForegroundColor Gray
    Write-Host "     └─ $($c.LastCommit)" -ForegroundColor DarkGray
}

Write-Host ""
$selection = Read-Host "병합할 브랜치 번호를 입력하세요 (엔터: 취소)"

if ([string]::IsNullOrWhiteSpace($selection)) {
    Write-Host "취소되었습니다." -ForegroundColor Gray
    if ($currentBranch -ne "master") { git checkout $currentBranch | Out-Null }
    exit
}

if ($selection -match "^\d+$" -and [int]$selection -lt $candidates.Count) {
    $targetBranch = $candidates[[int]$selection].Branch
    
    Write-Host "`n⚡ '$targetBranch' 브랜치를 Master로 병합합니다..." -ForegroundColor Cyan
    
    # Merge 수행
    git merge $targetBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 병합 성공!" -ForegroundColor Green
        
        $push = Read-Host "Origin/Master로 푸시하시겠습니까? (y/n)"
        if ($push -eq 'y') {
            git push origin master
            Write-Host "🚀 푸시 완료!" -ForegroundColor Green
            
            # 병합된 브랜치 삭제 제안 (선택 사항)
            # $del = Read-Host "병합된 로컬 브랜치($targetBranch)를 삭제하시겠습니까? (y/n)"
            # if ($del -eq 'y') { git branch -d $targetBranch }
        } else {
            Write-Host "푸시가 건너뛰어졌습니다. (로컬 Master에만 반영됨)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 병합 중 충돌(Conflict) 발생! 해결 후 커밋해주세요." -ForegroundColor Red
    }

} else {
    Write-Host "잘못된 입력입니다." -ForegroundColor Red
    if ($currentBranch -ne "master") { git checkout $currentBranch | Out-Null }
}
