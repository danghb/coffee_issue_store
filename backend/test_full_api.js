const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const HOST = 'localhost';
const PORT = 3000;
const BOUNDARY = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

// 统计
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

// 工具函数：发送请求
function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsedBody = data;
                try {
                    parsedBody = JSON.parse(data);
                } catch (e) {
                    // keep as string if not json
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsedBody,
                    rawBody: data
                });
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

// 工具函数：断言
function assert(name, condition, details = '') {
    stats.total++;
    if (condition) {
        stats.passed++;
        console.log(`✅ [PASS] ${name}`);
    } else {
        stats.failed++;
        console.error(`❌ [FAIL] ${name}`);
        if (details) console.error(`   Details: ${JSON.stringify(details).substring(0, 200)}...`);
    }
}

// 主测试流程
async function runFullTests() {
    console.log('🚀 Starting Full API Verification...\n');
    const timestamp = Date.now();
    let userToken = '';
    let adminToken = '';
    let testModelId = '';
    let testCategoryId = '';
    let testFieldId = '';
    let testIssueId = '';
    let testIssueNanoId = '';
    let testFileId = '';
    let testFilePath = '';

    try {
        // ==========================================
        // 1. 健康检查
        // ==========================================
        console.log('--- 1. Health Check ---');
        const pingRes = await request({ hostname: HOST, port: PORT, path: '/ping', method: 'GET' });
        assert('GET /ping', pingRes.statusCode === 200);

        // ==========================================
        // 2. 认证模块 (Auth)
        // ==========================================
        console.log('\n--- 2. Auth Module ---');

        // 注册
        const registerData = JSON.stringify({
            username: `testuser_${timestamp}`,
            password: 'password123',
            name: 'Test User'
        });
        const regRes = await request({
            hostname: HOST, port: PORT, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(registerData) }
        }, registerData);
        assert('POST /api/auth/register', regRes.statusCode === 201 || regRes.statusCode === 200);

        // 登录 (普通用户)
        const loginData = JSON.stringify({ username: `testuser_${timestamp}`, password: 'password123' });
        const loginRes = await request({
            hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
        }, loginData);
        assert('POST /api/auth/login (User)', loginRes.statusCode === 200 && loginRes.body.token);
        if (loginRes.body.token) userToken = loginRes.body.token;

        // 获取当前用户
        const meRes = await request({
            hostname: HOST, port: PORT, path: '/api/auth/me', method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert('GET /api/auth/me', meRes.statusCode === 200 && meRes.body.username === `testuser_${timestamp}`);

        // 登录 (管理员)
        const adminLoginData = JSON.stringify({ username: 'yfdz', password: 'yfdz@2026' });
        const adminLoginRes = await request({
            hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminLoginData) }
        }, adminLoginData);
        assert('POST /api/auth/login (Admin)', adminLoginRes.statusCode === 200 && adminLoginRes.body.token);
        if (adminLoginRes.body.token) adminToken = adminLoginRes.body.token;

        // ==========================================
        // 3. 系统设置 - 机型 (Settings - Models)
        // ==========================================
        console.log('\n--- 3. Settings - Models ---');

        // 创建机型
        const modelData = JSON.stringify({ name: `Model_${timestamp}` });
        const createModelRes = await request({
            hostname: HOST, port: PORT, path: '/api/settings/models', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(modelData) }
        }, modelData);
        assert('POST /api/settings/models', createModelRes.statusCode === 201);
        if (createModelRes.body.id) testModelId = createModelRes.body.id;

        // 获取机型列表
        const getModelsRes = await request({ hostname: HOST, port: PORT, path: '/api/settings/models', method: 'GET' });
        assert('GET /api/settings/models', getModelsRes.statusCode === 200 && Array.isArray(getModelsRes.body));

        // 更新机型 (之前报错的接口)
        if (testModelId) {
            const updateModelData = JSON.stringify({ name: `Model_${timestamp}_Updated`, isEnabled: true });
            const updateModelRes = await request({
                hostname: HOST, port: PORT, path: `/api/settings/models/${testModelId}`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateModelData) }
            }, updateModelData);
            assert('PUT /api/settings/models/:id', updateModelRes.statusCode === 200 && updateModelRes.body.name.includes('Updated'), updateModelRes.body);
        }

        // ==========================================
        // 4. 分类管理 (Categories)
        // ==========================================
        console.log('\n--- 4. Categories ---');

        // 创建分类
        const catData = JSON.stringify({ name: `Cat_${timestamp}` });
        const createCatRes = await request({
            hostname: HOST, port: PORT, path: '/api/categories', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(catData) }
        }, catData);
        assert('POST /api/categories', createCatRes.statusCode === 201 || createCatRes.statusCode === 200);
        if (createCatRes.body.id) testCategoryId = createCatRes.body.id;

        // 获取分类列表
        const getCatsRes = await request({ hostname: HOST, port: PORT, path: '/api/categories', method: 'GET' });
        assert('GET /api/categories', getCatsRes.statusCode === 200 && Array.isArray(getCatsRes.body));

        // 更新分类 (之前报错的接口)
        if (testCategoryId) {
            const updateCatData = JSON.stringify({ name: `Cat_${timestamp}_Updated` });
            const updateCatRes = await request({
                hostname: HOST, port: PORT, path: `/api/categories/${testCategoryId}`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateCatData) }
            }, updateCatData);
            assert('PUT /api/categories/:id', updateCatRes.statusCode === 200 && updateCatRes.body.name.includes('Updated'), updateCatRes.body);
        }

        // ==========================================
        // 5. 表单字段 (Form Fields)
        // ==========================================
        console.log('\n--- 5. Form Fields ---');

        // 创建字段
        const fieldData = JSON.stringify({ label: `Field_${timestamp}`, type: 'text', required: false, order: 1 });
        const createFieldRes = await request({
            hostname: HOST, port: PORT, path: '/api/settings/fields', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(fieldData) }
        }, fieldData);
        assert('POST /api/settings/fields', createFieldRes.statusCode === 201);
        if (createFieldRes.body.id) testFieldId = createFieldRes.body.id;

        // 获取字段列表
        const getFieldsRes = await request({ hostname: HOST, port: PORT, path: '/api/settings/fields', method: 'GET' });
        assert('GET /api/settings/fields', getFieldsRes.statusCode === 200 && Array.isArray(getFieldsRes.body));

        // [New] 更新字段
        if (testFieldId) {
            const updateFieldData = JSON.stringify({ label: `Field_${timestamp}_Updated` });
            const updateFieldRes = await request({
                hostname: HOST, port: PORT, path: `/api/settings/fields/${testFieldId}`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateFieldData) }
            }, updateFieldData);
            assert('PUT /api/settings/fields/:id', updateFieldRes.statusCode === 200);
        }

        // ==========================================
        // 6. SLA配置
        // ==========================================
        console.log('\n--- 6. SLA Config ---');

        // 获取和更新SLA
        const getSlaRes = await request({
            hostname: HOST, port: PORT, path: '/api/settings/sla', method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert('GET /api/settings/sla', getSlaRes.statusCode === 200);

        const updateSlaData = JSON.stringify({ targetSLA: 10, warningThreshold: 2 });
        const updateSlaRes = await request({
            hostname: HOST, port: PORT, path: '/api/settings/sla', method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateSlaData) }
        }, updateSlaData);
        assert('PUT /api/settings/sla', updateSlaRes.statusCode === 200);

        // ==========================================
        // 7. 问题管理 (Issues)
        // ==========================================
        console.log('\n--- 7. Issues ---');

        // 创建问题
        const issueData = JSON.stringify({
            title: `Issue_${timestamp}`,
            description: 'Test Description',
            severity: 1,
            modelId: testModelId || 1,
            reporterName: 'Tester'
        });
        const createIssueRes = await request({
            hostname: HOST, port: PORT, path: '/api/issues', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(issueData) }
        }, issueData);
        assert('POST /api/issues', createIssueRes.statusCode === 201 || createIssueRes.statusCode === 200);
        if (createIssueRes.body.id) {
            testIssueId = createIssueRes.body.id;
            testIssueNanoId = createIssueRes.body.nanoId;
        }

        // 获取列表
        const getIssuesRes = await request({
            hostname: HOST, port: PORT, path: '/api/issues', method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert('GET /api/issues', getIssuesRes.statusCode === 200 && getIssuesRes.body.items);

        // [New] 获取机型列表 (Public Issues)
        const getIssueModelsRes = await request({ hostname: HOST, port: PORT, path: '/api/issues/models', method: 'GET' });
        assert('GET /api/issues/models', getIssueModelsRes.statusCode === 200);

        // 获取详情
        if (testIssueId) {
            const getIssueRes = await request({
                hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}`, method: 'GET',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            assert('GET /api/issues/:id', getIssueRes.statusCode === 200 && getIssueRes.body.id === testIssueId);

            // [New] 更新问题内容
            const updateIssueData = JSON.stringify({ description: 'Updated Description' });
            const updateIssueRes = await request({
                hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateIssueData) }
            }, updateIssueData);
            assert('PUT /api/issues/:id', updateIssueRes.statusCode === 200);

            // 更新状态 (Admin)
            const updateStatusData = JSON.stringify({ status: 'IN_PROGRESS', author: 'Admin' });
            const updateStatusRes = await request({
                hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}/status`, method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'Content-Length': Buffer.byteLength(updateStatusData) }
            }, updateStatusData);
            assert('PATCH /api/issues/:id/status', updateStatusRes.statusCode === 200);

            // 添加评论
            const commentData = JSON.stringify({ content: 'Test Comment', author: 'Tester' });
            const addCommentRes = await request({
                hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}/comments`, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(commentData) }
            }, commentData);
            assert('POST /api/issues/:id/comments', addCommentRes.statusCode === 201 || addCommentRes.statusCode === 200);

            // [New] 更新评论
            if (addCommentRes.body && addCommentRes.body.id) {
                const commentId = addCommentRes.body.id;
                const updateCommentData = JSON.stringify({ content: 'Updated Comment' });
                const updateCommentRes = await request({
                    hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}/comments/${commentId}`, method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(updateCommentData) }
                }, updateCommentData);
                assert('PUT /api/issues/:id/comments/:commentId', updateCommentRes.statusCode === 200);
            }

            // [New] 合并/取消合并测试 (需要第二个工单)
            // 创建第二个临时工单
            const issueData2 = JSON.stringify({ title: `Issue_Child_${timestamp}`, description: 'Child', severity: 3, modelId: testModelId || 1, reporterName: 'Tester2' });
            const createChildRes = await request({
                hostname: HOST, port: PORT, path: '/api/issues', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}`, 'Content-Length': Buffer.byteLength(issueData2) }
            }, issueData2);

            if (createChildRes.statusCode === 201 || createChildRes.statusCode === 200) {
                const childId = createChildRes.body.id;

                // Merge
                const mergeData = JSON.stringify({ childIds: [childId] });
                const mergeRes = await request({
                    hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}/merge`, method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'Content-Length': Buffer.byteLength(mergeData) }
                }, mergeData);
                assert('POST /api/issues/:id/merge', mergeRes.statusCode === 200);

                // Unmerge
                const unmergeRes = await request({
                    hostname: HOST, port: PORT, path: `/api/issues/${childId}/unmerge`, method: 'POST',
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                assert('POST /api/issues/:id/unmerge', unmergeRes.statusCode === 200);

                // Cleanup child
                await request({
                    hostname: HOST, port: PORT, path: `/api/issues/${childId}`, method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
            }
        }

        // ==========================================
        // 8. 上传与下载 (Uploads)
        // ==========================================
        console.log('\n--- 8. Uploads ---');

        const fileContent = 'Test File Content';
        const filename = 'test.txt';
        let payload = `--${BOUNDARY}\r\n`;
        payload += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        payload += `Content-Type: text/plain\r\n\r\n`;
        payload += `${fileContent}\r\n`;
        payload += `--${BOUNDARY}--\r\n`;

        const uploadRes = await request({
            hostname: HOST, port: PORT, path: '/api/uploads', method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        }, payload);
        assert('POST /api/uploads', uploadRes.statusCode === 201 || uploadRes.statusCode === 200);

        if (uploadRes.body.path) {
            testFilePath = uploadRes.body.path;
            const downloadRes = await request({
                hostname: HOST, port: PORT, path: `/api/uploads/files/${testFilePath}`, method: 'GET'
            });
            assert('GET /api/uploads/files/:path', downloadRes.statusCode === 200 && downloadRes.rawBody === fileContent);
        } else {
            assert('GET /api/uploads/files/:path', false, 'Skipped because upload failed');
        }

        // ==========================================
        // 9. 统计模块
        // ==========================================
        console.log('\n--- 9. Stats ---');
        const dashboardRes = await request({
            hostname: HOST, port: PORT, path: '/api/stats/dashboard', method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert('GET /api/stats/dashboard', dashboardRes.statusCode === 200);

        const exportRes = await request({
            hostname: HOST, port: PORT, path: '/api/stats/export', method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert('GET /api/stats/export', exportRes.statusCode === 200);

        // ==========================================
        // 10. 用户管理 (Admin Only)
        // ==========================================
        console.log('\n--- 10. User Management ---');
        const getUsersRes = await request({
            hostname: HOST, port: PORT, path: '/api/users', method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert('GET /api/users', getUsersRes.statusCode === 200 && Array.isArray(getUsersRes.body));

        // 查找我们创建的测试用户ID
        let targetUserId = null;
        if (getUsersRes.body && Array.isArray(getUsersRes.body)) {
            const foundUser = getUsersRes.body.find(u => u.username === `testuser_${timestamp}`);
            if (foundUser) targetUserId = foundUser.id;
        }

        if (targetUserId) {
            // [New] 更新角色
            const updateRoleData = JSON.stringify({ role: 'DEVELOPER' });
            const updateRoleRes = await request({
                hostname: HOST, port: PORT, path: `/api/users/${targetUserId}/role`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'Content-Length': Buffer.byteLength(updateRoleData) }
            }, updateRoleData);
            assert('PUT /api/users/:id/role', updateRoleRes.statusCode === 200);

            // [New] 重置密码
            const resetPwdData = JSON.stringify({ newPassword: 'newpassword123' });
            const resetPwdRes = await request({
                hostname: HOST, port: PORT, path: `/api/users/${targetUserId}/password`, method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, 'Content-Length': Buffer.byteLength(resetPwdData) }
            }, resetPwdData);
            assert('PUT /api/users/:id/password', resetPwdRes.statusCode === 200);

            // [New] 删除用户
            // 注意：因为我们在后面Cleanup里还需要用到userToken来删除资源，所以如果在这里删除了用户，后续操作会失败
            // 策略：我们创建一个临时用户来测试删除功能

            // 1. 创建临时用户
            const tempUserData = JSON.stringify({ username: `temp_${timestamp}`, password: '123' });
            const createTempRes = await request({
                hostname: HOST, port: PORT, path: '/api/auth/register', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tempUserData) }
            }, tempUserData);

            if (createTempRes.statusCode === 201) {
                const tempUserId = createTempRes.body.id;
                // 2. 删除临时用户
                const delUserRes = await request({
                    hostname: HOST, port: PORT, path: `/api/users/${tempUserId}`, method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                assert('DELETE /api/users/:id', delUserRes.statusCode === 200 || delUserRes.statusCode === 204);
            }
        }

        // ==========================================
        // 11. 清理数据 (Delete Operations)
        // ==========================================
        console.log('\n--- 11. Cleanup (Delete) ---');

        // 先删除Issue (解除外键引用)
        if (testIssueId) {
            const delIssueRes = await request({
                hostname: HOST, port: PORT, path: `/api/issues/${testIssueId}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            assert('DELETE /api/issues/:id (Admin)', delIssueRes.statusCode === 204 || delIssueRes.statusCode === 200, delIssueRes.body);
        }

        if (testFieldId) {
            const delFieldRes = await request({
                hostname: HOST, port: PORT, path: `/api/settings/fields/${testFieldId}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            assert('DELETE /api/settings/fields/:id', delFieldRes.statusCode === 204 || delFieldRes.statusCode === 200, delFieldRes.body);
        }

        if (testCategoryId) {
            const delCatRes = await request({
                hostname: HOST, port: PORT, path: `/api/categories/${testCategoryId}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            assert('DELETE /api/categories/:id', delCatRes.statusCode === 204 || delCatRes.statusCode === 200, delCatRes.body);
        }

        if (testModelId) {
            const delModelRes = await request({
                hostname: HOST, port: PORT, path: `/api/settings/models/${testModelId}`, method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            assert('DELETE /api/settings/models/:id', delModelRes.statusCode === 204 || delModelRes.statusCode === 200, delModelRes.body);
        }

    } catch (e) {
        console.error('Critical Error:', e);
    }

    // 总结
    console.log('\n=============================================');
    console.log(`Summary: Total ${stats.total}, Passed ${stats.passed}, Failed ${stats.failed}`);
    console.log(`Success Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);
    console.log('=============================================');
}

runFullTests().catch(console.error);
