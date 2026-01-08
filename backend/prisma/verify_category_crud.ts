
const API_URL = 'http://127.0.0.1:3000/api';

async function verify() {
    try {
        // Need axios or fetch. using fetch.
        console.log('1. Creating Category...');
        const createRes = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'TestCRUD' })
        });
        if (!createRes.ok) throw new Error(`Create failed: ${createRes.statusText}`);
        const cat = await createRes.json() as any;
        console.log('Created:', cat);

        console.log('2. Updating Category...');
        const updateRes = await fetch(`${API_URL}/categories/${cat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'TestCRUD_Updated' })
        });
        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.statusText}`);
        const updated = await updateRes.json() as any;
        console.log('Updated:', updated);
        if (updated.name !== 'TestCRUD_Updated') throw new Error('Update name mismatch');

        console.log('3. Deleting Category...');
        const deleteRes = await fetch(`${API_URL}/categories/${cat.id}`, {
            method: 'DELETE'
        });
        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.statusText}`);
        console.log('Deleted.');

        console.log('SUCCESS: Category CRUD Verified.');
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
}

verify();
