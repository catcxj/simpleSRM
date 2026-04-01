fetch('http://localhost:3000/api/projects/5910abfc-8882-475b-9c27-b171a05bc6c8', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Test Project Updated',
        projectManager: 'Bob',
    })
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);
