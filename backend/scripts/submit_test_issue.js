// Node 22+ has native fetch support
const API_URL = 'http://localhost:3000/api/issues';

async function submitTestIssue() {
    console.log('🚀 Submitting test issue...');

    const payload = {
        title: "测试问题 - " + new Date().toLocaleString(),
        description: "这是一个由脚本自动提交的测试问题，用于验证系统部署是否成功。",
        modelId: 1, // 假设 ID 1 的机型 (M50) 存在 (由 seed 生成)
        reporterName: "自动测试员",
        priority: "P2",
        severity: 2
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Issue submitted successfully!');
            console.log('------------------------------------------------');
            console.log(`ID:       ${data.id}`);
            console.log(`NanoID:   ${data.nanoId}`);
            console.log(`Title:    ${data.title}`);
            console.log(`Status:   ${data.status}`);
            console.log('------------------------------------------------');
        } else {
            console.error('❌ Failed to submit issue.');
            console.error(`Status: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error submitting issue:', error);
        console.log('Hint: Ensure the backend server is running on port 3000.');
    }
}

submitTestIssue();
