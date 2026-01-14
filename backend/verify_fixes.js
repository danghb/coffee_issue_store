const https = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const HOST = 'localhost';
const PORT = 3000;
const BOUNDARY = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
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

async function runTests() {
    console.log('Starting verification tests...');

    // 1. 登录
    console.log('\n--- 1. Login ---');
    const loginData = JSON.stringify({ username: 'yfdz', password: 'yfdz@2026' });
    const loginRes = await request({
        hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);

    if (loginRes.statusCode !== 200) {
        console.error('Login failed:', loginRes.statusCode, loginRes.body);
        return;
    }
    const token = JSON.parse(loginRes.body).token;
    console.log('Login successful');

    // 2. 更新分类 (测试中文支持)
    console.log('\n--- 2. Update Category ---');
    // 先获取一个分类ID
    const catsRes = await request({ hostname: HOST, port: PORT, path: '/api/categories', method: 'GET' });
    const cats = JSON.parse(catsRes.body);
    if (cats.length > 0) {
        const catId = cats[0].id;
        const updateData = JSON.stringify({ name: '已修复分类' });
        const updateRes = await request({
            hostname: HOST, port: PORT, path: `/api/categories/${catId}`, method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(updateData)
            }
        }, updateData);
        console.log(`Update Category ${catId} Status:`, updateRes.statusCode);
        console.log('Response:', updateRes.body);
    } else {
        console.log('No categories to test update');
    }

    // 3. 文件上传和下载
    console.log('\n--- 3. File Upload & Download ---');
    const fileContent = 'Hello World Verification Content';
    const filename = 'verify.txt';

    // 构建Multipart body
    let payload = `--${BOUNDARY}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    payload += `Content-Type: text/plain\r\n\r\n`;
    payload += `${fileContent}\r\n`;
    payload += `--${BOUNDARY}--\r\n`;

    const uploadRes = await request({
        hostname: HOST, port: PORT, path: '/api/uploads', method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
            'Content-Length': Buffer.byteLength(payload)
        }
    }, payload);

    console.log('Upload Status:', uploadRes.statusCode);
    if (uploadRes.statusCode === 200 || uploadRes.statusCode === 201) {
        const uploadData = JSON.parse(uploadRes.body);
        console.log('Uploaded file data:', uploadData);

        // 4. 下载
        console.log('\n--- 4. Download File ---');
        // 注意：API期望的是存储的文件路径(path/UUID)，而不是原始文件名
        if (uploadData.path) {
            const downloadPath = `/api/uploads/files/${uploadData.path}`;
            console.log('Downloading from:', downloadPath);
            const downloadRes = await request({
                hostname: HOST, port: PORT, path: downloadPath, method: 'GET'
            });
            console.log('Download Status:', downloadRes.statusCode);
            if (downloadRes.statusCode === 200) {
                console.log('Content matched:', downloadRes.body === fileContent);
            } else {
                console.log('Download failed body:', downloadRes.body);
            }
        }
    } else {
        console.log('Upload failed body:', uploadRes.body);
    }
}

runTests().catch(console.error);
