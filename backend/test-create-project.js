fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        code: 'PRJ-TEST-02',
        name: 'Test Project',
        projectManager: 'Alice',
        status: 'Active'
    })
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);
