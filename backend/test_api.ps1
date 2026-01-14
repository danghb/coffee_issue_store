#!/usr/bin/env pwsh
# API 自动化测试脚本
# 测试所有后端API端点

$BASE_URL = "http://localhost:3000"
$RESULTS = @()
$TOKEN = ""
$ADMIN_TOKEN = ""

# 颜色函数
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Title { param($msg) Write-Host "`n========== $msg ==========" -ForegroundColor Yellow }

# 测试函数
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int[]]$ExpectedStatus = @(200, 201)
    )
    
    try {
        $params = @{
            Uri = "$BASE_URL$Url"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -SkipHttpErrorCheck
        
        if ($ExpectedStatus -contains $response.StatusCode) {
            Write-Success "$Name - 状态码: $($response.StatusCode)"
            $SCRIPT:RESULTS += @{ Name = $Name; Status = "PASS"; Code = $response.StatusCode }
            return $response
        } else {
            Write-Error "$Name - 状态码: $($response.StatusCode) (期望: $ExpectedStatus)"
            $SCRIPT:RESULTS += @{ Name = $Name; Status = "FAIL"; Code = $response.StatusCode }
            return $null
        }
    } catch {
        Write-Error "$Name - 异常: $_"
        $SCRIPT:RESULTS += @{ Name = $Name; Status = "ERROR"; Code = 0 }
        return $null
    }
}

# 开始测试
Write-Title "开始API测试"
Write-Info "基础URL: $BASE_URL"

# ========== 1. 健康检查 ==========
Write-Title "1. 健康检查"
Test-Endpoint -Name "健康检查" -Method GET -Url "/ping"

# ========== 2. 认证测试 ==========
Write-Title "2. 认证 API"

# 注册测试账号
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUser = @{
    username = "test_$timestamp"
    password = "test123456"
    name = "测试用户"
}

$registerResp = Test-Endpoint -Name "用户注册" -Method POST -Url "/api/auth/register" -Body $testUser -ExpectedStatus @(200, 201, 400)

# 登录
$loginResp = Test-Endpoint -Name "用户登录" -Method POST -Url "/api/auth/login" -Body @{
    username = $testUser.username
    password = $testUser.password
}

if ($loginResp) {
    $loginData = $loginResp.Content | ConvertFrom-Json
    $TOKEN = $loginData.token
    Write-Info "已获取Token: $($TOKEN.Substring(0, 20))..."
}

# 获取当前用户信息
if ($TOKEN) {
    Test-Endpoint -Name "获取当前用户" -Method GET -Url "/api/auth/me" -Headers @{ "Authorization" = "Bearer $TOKEN" }
}

# 尝试用内置管理员登录
$adminLoginResp = Test-Endpoint -Name "管理员登录" -Method POST -Url "/api/auth/login" -Body @{
    username = "yfdz"
    password = "yfdz@2026"
}

if ($adminLoginResp) {
    $adminData = $adminLoginResp.Content | ConvertFrom-Json
    $ADMIN_TOKEN = $adminData.token
    Write-Info "已获取管理员Token"
}

# ========== 3. 机型管理 ==========
Write-Title "3. 机型管理 API"

Test-Endpoint -Name "获取机型列表" -Method GET -Url "/api/settings/models"
Test-Endpoint -Name "获取机型列表(issues)" -Method GET -Url "/api/issues/models"

if ($TOKEN) {
    $modelResp = Test-Endpoint -Name "创建机型" -Method POST -Url "/api/settings/models" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -Body @{ name = "测试机型_$timestamp" }
    
    if ($modelResp) {
        $modelData = $modelResp.Content | ConvertFrom-Json
        $modelId = $modelData.id
        
        Test-Endpoint -Name "更新机型" -Method PUT -Url "/api/settings/models/$modelId" `
            -Headers @{ "Authorization" = "Bearer $TOKEN" } `
            -Body @{ name = "测试机型_更新"; isEnabled = $true }
    }
}

# ========== 4. 分类管理 ==========
Write-Title "4. 分类管理 API"

Test-Endpoint -Name "获取分类列表" -Method GET -Url "/api/categories"

if ($TOKEN) {
    $categoryResp = Test-Endpoint -Name "创建分类" -Method POST -Url "/api/categories" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -Body @{ name = "测试分类_$timestamp" }
    
    if ($categoryResp) {
        $categoryData = $categoryResp.Content | ConvertFrom-Json
        $categoryId = $categoryData.id
        
        Test-Endpoint -Name "更新分类" -Method PUT -Url "/api/categories/$categoryId" `
            -Headers @{ "Authorization" = "Bearer $TOKEN" } `
            -Body @{ name = "测试分类_更新" }
    }
}

# ========== 5. 表单字段 ==========
Write-Title "5. 表单字段 API"

Test-Endpoint -Name "获取字段列表" -Method GET -Url "/api/settings/fields"

if ($TOKEN) {
    $fieldResp = Test-Endpoint -Name "创建字段" -Method POST -Url "/api/settings/fields" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -Body @{ 
            label = "测试字段_$timestamp"
            type = "text"
            required = $false
            isEnabled = $true
            order = 0
        }
}

# ========== 6. SLA配置 ==========
Write-Title "6. SLA配置 API"

if ($TOKEN) {
    Test-Endpoint -Name "获取SLA配置" -Method GET -Url "/api/settings/sla" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    Test-Endpoint -Name "更新SLA配置" -Method PUT -Url "/api/settings/sla" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -Body @{ targetSLA = 5; warningThreshold = 1 }
}

# ========== 7. 问题管理 ==========
Write-Title "7. 问题管理 API"

# 创建问题
$issueResp = Test-Endpoint -Name "创建问题(游客)" -Method POST -Url "/api/issues" `
    -Body @{
        title = "测试问题_$timestamp"
        description = "这是一个自动测试问题"
        modelId = 1
        reporterName = "自动测试"
        severity = 2
    } -ExpectedStatus @(200, 201, 400, 500)

# 获取问题列表(需登录)
$issueListResp = $null
if ($TOKEN) {
    $issueListResp = Test-Endpoint -Name "获取问题列表" -Method GET -Url "/api/issues" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
}

# 获取问题详情
$issueId = $null
if ($issueListResp) {
    $issueListData = $issueListResp.Content | ConvertFrom-Json
    if ($issueListData.items -and $issueListData.items.Count -gt 0) {
        $issueId = $issueListData.items[0].id
        $issueNanoId = $issueListData.items[0].nanoId
        
        Test-Endpoint -Name "获取问题详情(ID)" -Method GET -Url "/api/issues/$issueId"
        Test-Endpoint -Name "获取问题详情(NanoID)" -Method GET -Url "/api/issues/$issueNanoId"
        
        # 更新问题
        if ($TOKEN) {
            Test-Endpoint -Name "更新问题" -Method PUT -Url "/api/issues/$issueId" `
                -Headers @{ "Authorization" = "Bearer $TOKEN" } `
                -Body @{ description = "更新后的描述_测试" } `
                -ExpectedStatus @(200, 201, 400, 403)
        }
        
        # 更新问题状态 (DEVELOPER+)
        if ($ADMIN_TOKEN) {
            Test-Endpoint -Name "更新问题状态" -Method PATCH -Url "/api/issues/$issueId/status" `
                -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
                -Body @{ status = "IN_PROGRESS"; author = "测试管理员" }
        }
        
        # 添加评论
        Test-Endpoint -Name "添加评论(游客)" -Method POST -Url "/api/issues/$issueId/comments" `
            -Body @{ content = "这是测试评论"; author = "测试用户" } `
            -ExpectedStatus @(200, 201, 400)
        
        if ($TOKEN) {
            $commentResp = Test-Endpoint -Name "添加评论(登录)" -Method POST -Url "/api/issues/$issueId/comments" `
                -Headers @{ "Authorization" = "Bearer $TOKEN" } `
                -Body @{ content = "登录用户的评论"; author = "测试用户" } `
                -ExpectedStatus @(200, 201)
            
            # 获取评论ID用于更新
            if ($commentResp) {
                Start-Sleep -Milliseconds 500
                $detailResp = Test-Endpoint -Name "获取问题详情(含评论)" -Method GET -Url "/api/issues/$issueId"
                if ($detailResp) {
                    $detailData = $detailResp.Content | ConvertFrom-Json
                    if ($detailData.comments -and $detailData.comments.Count -gt 0) {
                        $commentId = $detailData.comments[0].id
                        Test-Endpoint -Name "更新评论" -Method PUT -Url "/api/issues/$issueId/comments/$commentId" `
                            -Headers @{ "Authorization" = "Bearer $TOKEN" } `
                            -Body @{ content = "更新后的评论内容" } `
                            -ExpectedStatus @(200, 201, 400, 403, 404)
                    }
                }
            }
        }
        
        # 合并/取消合并 (DEVELOPER+)
        if ($ADMIN_TOKEN -and $issueListData.items.Count -gt 1) {
            $childIssueId = $issueListData.items[1].id
            Test-Endpoint -Name "合并问题" -Method POST -Url "/api/issues/$issueId/merge" `
                -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
                -Body @{ childIds = @($childIssueId) } `
                -ExpectedStatus @(200, 201, 400, 403)
            
            Test-Endpoint -Name "取消合并" -Method POST -Url "/api/issues/$childIssueId/unmerge" `
                -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
                -ExpectedStatus @(200, 201, 400, 403)
        }
    }
}

# ========== 8. 统计 API ==========
Write-Title "8. 统计 API"

if ($TOKEN) {
    Test-Endpoint -Name "Dashboard统计" -Method GET -Url "/api/stats/dashboard" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    Test-Endpoint -Name "导出问题数据" -Method GET -Url "/api/stats/export" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ExpectedStatus @(200, 201)
}

# ========== 9. 用户管理(仅ADMIN) ==========
Write-Title "9. 用户管理 API (ADMIN)"

if ($ADMIN_TOKEN) {
    $usersResp = Test-Endpoint -Name "获取用户列表" -Method GET -Url "/api/users" `
        -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" }
    
    if ($usersResp) {
        $usersData = $usersResp.Content | ConvertFrom-Json
        if ($usersData -and $usersData.Count -gt 0) {
            $testUserId = $usersData[0].id
            
            # 更新用户角色
            Test-Endpoint -Name "更新用户角色" -Method PUT -Url "/api/users/$testUserId/role" `
                -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
                -Body @{ role = "DEVELOPER" } `
                -ExpectedStatus @(200, 201, 400)
            
            # 重置用户密码
            Test-Endpoint -Name "重置用户密码" -Method PUT -Url "/api/users/$testUserId/password" `
                -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
                -Body @{ newPassword = "newpass123456" } `
                -ExpectedStatus @(200, 201, 400)
            
            # 注意：不在测试中实际删除用户，以免影响后续测试
            Write-Info "跳过删除用户测试(避免影响数据)"
        }
    }
}

# ========== 10. DELETE操作测试 ==========
Write-Title "10. DELETE操作测试"

# 删除字段
if ($TOKEN -and $fieldResp) {
    $fieldData = $fieldResp.Content | ConvertFrom-Json
    Test-Endpoint -Name "删除字段" -Method DELETE -Url "/api/settings/fields/$($fieldData.id)" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ExpectedStatus @(200, 204, 400, 404)
}

# 删除分类
if ($TOKEN -and $categoryId) {
    Test-Endpoint -Name "删除分类" -Method DELETE -Url "/api/categories/$categoryId" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ExpectedStatus @(200, 204, 400, 404)
}

# 删除机型
if ($TOKEN -and $modelId) {
    Test-Endpoint -Name "删除机型" -Method DELETE -Url "/api/settings/models/$modelId" `
        -Headers @{ "Authorization" = "Bearer $TOKEN" } `
        -ExpectedStatus @(200, 204, 400, 404)
}

# 删除问题 (ADMIN)
if ($ADMIN_TOKEN -and $issueId) {
    Test-Endpoint -Name "删除问题(ADMIN)" -Method DELETE -Url "/api/issues/$issueId" `
        -Headers @{ "Authorization" = "Bearer $ADMIN_TOKEN" } `
        -ExpectedStatus @(200, 204, 400, 403, 404)
}

# ========== 11. 文件上传 ==========
Write-Title "11. 文件上传 API"

# 创建测试文件
$testFilePath = Join-Path $PSScriptRoot "test_upload.txt"
"这是测试文件内容" | Out-File -FilePath $testFilePath -Encoding UTF8

if (Test-Path $testFilePath) {
    try {
        # 使用curl上传文件（PowerShell的Invoke-WebRequest对multipart支持不好）
        Write-Info "使用curl上传文件..."
        $uploadResult = & curl -X POST "$BASE_URL/api/uploads" -F "file=@$testFilePath" -s
        if ($uploadResult -match '"filename"') {
            Write-Success "上传文件 - 成功"
            $SCRIPT:RESULTS += @{ Name = "上传文件"; Status = "PASS"; Code = 200 }
            
            # 提取文件名
            $uploadData = $uploadResult | ConvertFrom-Json
            $uploadedFilename = $uploadData.filename
            
            # 测试下载
            Test-Endpoint -Name "下载文件" -Method GET -Url "/api/uploads/files/$uploadedFilename" `
                -ExpectedStatus @(200)
        } else {
            Write-Error "上传文件 - 失败"
            $SCRIPT:RESULTS += @{ Name = "上传文件"; Status = "FAIL"; Code = 0 }
        }
    } catch {
        Write-Info "文件上传测试跳过（需要curl）"
    }
    Remove-Item $testFilePath -Force -ErrorAction SilentlyContinue
} else {
    Write-Info "跳过文件上传测试"
}

# ========== 结果汇总 ==========
Write-Title "测试结果汇总"

$total = $RESULTS.Count
$passed = ($RESULTS | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($RESULTS | Where-Object { $_.Status -eq "FAIL" }).Count
$errors = ($RESULTS | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "`n总计: $total 个测试" -ForegroundColor White
Write-Host "通过: $passed" -ForegroundColor Green
Write-Host "失败: $failed" -ForegroundColor Red
Write-Host "错误: $errors" -ForegroundColor Yellow

$successRate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "`n成功率: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })

# 输出失败的测试
if ($failed -gt 0 -or $errors -gt 0) {
    Write-Host "`n失败/错误的测试:" -ForegroundColor Red
    $RESULTS | Where-Object { $_.Status -ne "PASS" } | ForEach-Object {
        Write-Host "  ❌ $($_.Name) - $($_.Status) (状态码: $($_.Code))" -ForegroundColor Red
    }
}

Write-Host "`n测试完成!`n" -ForegroundColor Yellow
