// 简单的测试脚本
const https = require('http');

async function testAPI() {
    // 1. 登录
    const loginData = JSON.stringify({
        username: 'yfdz',
        password: 'yfdz@2026'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    return new Promise((resolve) => {
        const req = https.request(loginOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('Login success, token:', result.token.substring(0, 20) + '...');

                // 2. 测试更新机型
                const updateData = JSON.stringify({ name: 'TestModel' });
                const updateOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/settings/models/1',
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.token}`,
                        'Content-Length': updateData.length
                    }
                };

                const updateReq = https.request(updateOptions, (updateRes) => {
                    let updateData = '';
                    updateRes.on('data', (chunk) => { updateData += chunk; });
                    updateRes.on('end', () => {
                        console.log('Update Model Response:', updateRes.statusCode);
                        console.log('Body:', updateData);
                        resolve();
                    });
                });

                updateReq.on('error', (e) => {
                    console.error('Update request error:', e);
                    resolve();
                });

                updateReq.write(updateData);
                updateReq.end();
            });
        });

        req.on('error', (e) => {
            console.error('Login error:', e);
            resolve();
        });

        req.write(loginData);
        req.end();
    });
}

testAPI().then(() => process.exit(0));
