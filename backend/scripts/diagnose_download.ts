
async function checkDownload() {
    const fileId = '6e0e76c6-6f38-4037-96d8-cb879a52a6c3.jpg'; // The JPG file
    // Direct backend URL
    const backendUrl = `http://127.0.0.1:3000/api/uploads/files/${fileId}`;
    // Frontend Proxy URL
    const proxyUrl = `http://127.0.0.1:5173/api/uploads/files/${fileId}`;

    console.log('--- Checking Direct Backend ---');
    try {
        const res = await fetch(backendUrl);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Length Header: ${res.headers.get('content-length')}`);
        const buffer = await res.arrayBuffer();
        console.log(`Actual Body Length: ${buffer.byteLength}`);
        console.log(`Body Sample (String): ${new TextDecoder().decode(buffer.slice(0, 100))}`);
    } catch (e: any) {
        console.error('Backend Error:', e.message);
    }

    console.log('\n--- Checking Frontend Proxy ---');
    try {
        const res = await fetch(proxyUrl);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Length Header: ${res.headers.get('content-length')}`);
        const buffer = await res.arrayBuffer();
        console.log(`Actual Body Length: ${buffer.byteLength}`);
        console.log(`Body Sample (String): ${new TextDecoder().decode(buffer.slice(0, 100))}`);
    } catch (e: any) {
        console.error('Proxy Error:', e.message);
    }
}

checkDownload();
