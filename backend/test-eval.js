async function test() {
    console.log("Testing evaluation trigger...");
    try {
        const response = await fetch("http://localhost:3000/api/evaluations/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                year: 2026,
                deadline: new Date(2026, 11, 30).toISOString(),
                period: "Yearly"
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Data:", data);
    } catch (e) {
        console.error(e);
    }
}

test();
