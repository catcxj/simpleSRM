async function test() {
    try {
        const contractsRes = await fetch('http://localhost:3000/api/contracts');
        const contracts = await contractsRes.json();

        const projectsRes = await fetch('http://localhost:3000/api/projects');
        const projects = await projectsRes.json();

        const suppliersRes = await fetch('http://localhost:3000/api/suppliers');
        const suppliers = await suppliersRes.json();

        if (contracts.data.data.length > 0 && projects.data.data.length > 0 && suppliers.data.data.length > 0) {
            const id = contracts.data.data[0].id;
            const res = await fetch(`http://localhost:3000/api/contracts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name Correct UUID',
                    projectId: projects.data.data[0].id,
                    supplierId: suppliers.data.data[0].id
                })
            });
            console.log(await res.json());
        } else {
            console.log('not enough data');
        }
    } catch (e) {
        console.error(e);
    }
}
test();
