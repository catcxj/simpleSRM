import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runWorkflow() {
    console.log("1. Starting Workflow Execution test...");

    // Create Role
    const role = await prisma.role.upsert({
        where: { name: '项目经理' },
        update: {},
        create: { name: '项目经理', description: '项目主要负责人' }
    });
    console.log("Created/Found Role:", role.name);

    // Create User
    const user = await prisma.user.upsert({
        where: { username: 'pm_user' },
        update: {},
        create: { username: 'pm_user', password: 'password123', name: '王经理', roleId: role.id }
    });
    console.log("Created/Found User:", user.name);

    // Create Supplier
    const supplier = await prisma.supplier.create({
        data: {
            name: '测试供应商_' + Date.now(),
            businessType: '测试',
            status: 'Active'
        }
    });
    console.log("Created Supplier:", supplier.name);

    // Create Project
    const project = await prisma.project.create({
        data: {
            code: 'PROJ_' + Date.now(),
            name: '测试评价项目_' + Date.now(),
            projectManager: user.name, // Link to PM
            status: 'Active'
        }
    });
    console.log("Created Project:", project.name);

    // Create Contract
    const contract = await prisma.contract.create({
        data: {
            code: 'CONT_' + Date.now(),
            name: '测试合同',
            amount: 10000,
            signedAt: new Date(),
            projectId: project.id,
            supplierId: supplier.id
        }
    });
    console.log("Created Contract:", contract.code);

    // 2. Trigger Task Generation
    console.log("2. Triggering Evaluation Task creation...");
    const taskData = {
        year: 2026,
        deadline: new Date(2026, 11, 30).toISOString(),
        period: "Yearly",
        projectId: project.id
    };

    const taskRes = await fetch("http://localhost:3000/api/evaluations/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
    });
    const taskJson = await taskRes.json();
    console.log("Task API Response:", taskJson);

    if (taskRes.status !== 201 && taskRes.status !== 200) {
        console.error("Failed to create task", taskJson);
        return;
    }

    const taskId = taskJson.data.id;

    // Check EvaluationRecord Creation
    const records = await prisma.evaluationRecord.findMany({
        where: { taskId: taskId }
    });

    console.log(`Found ${records.length} evaluation record(s) created from the contracts list.`);

    if (records.length === 0) {
        console.log("Oops, no records created. The contract might not be recognized or supplier is not valid.");
        return;
    }

    const recordId = records[0].id;
    console.log("Draft record created, ID:", recordId);

    // 3. Submit Evaluation
    console.log("3. Submitting Evaluation as Project Manager...");
    const submitData = {
        recordId: recordId,
        details: [
            { indicatorKey: 'quality', score: 60 } // Default qualified score
        ],
        problem: '前期响应较慢，后期有所改善，整体表现合格。'
    };

    const submitRes = await fetch("http://localhost:3000/api/evaluations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
    });

    if (submitRes.status !== 201 && submitRes.status !== 200) {
        console.error("Submission failed", await submitRes.text());
        return;
    }

    const submitJson = await submitRes.json();
    console.log("Submission successful!");

    // 4. Verify Final State
    const finalRecord = await prisma.evaluationRecord.findUnique({ where: { id: recordId } });
    console.log(`Final Evaluation Status: ${finalRecord?.status}, Total Score: ${finalRecord?.totalScore}, Grade: ${finalRecord?.grade}, Problem: ${finalRecord?.problem}`);

    console.log("Workflow Execution Completed Successfully!");
}

runWorkflow().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
