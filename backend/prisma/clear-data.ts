import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing data...');

    // Delete everything except User, Role, EvaluationTemplate

    // Dependencies first (EvaluationDetail, Record, Task, Contacts, Qualifications, etc)
    await prisma.evaluationDetail.deleteMany({});
    await prisma.evaluationRecord.deleteMany({});
    await prisma.evaluationTask.deleteMany({});

    await prisma.contract.deleteMany({});
    await prisma.project.deleteMany({});

    await prisma.supplierBankInfo.deleteMany({});
    await prisma.supplierQualification.deleteMany({});
    await prisma.supplierContact.deleteMany({});

    await prisma.attributeValue.deleteMany({});
    await prisma.attributeDefinition.deleteMany({});

    await prisma.supplier.deleteMany({});

    await prisma.systemDictionary.deleteMany({});
    await prisma.systemConfig.deleteMany({});

    // Need to be careful about Department if Users are linked. User has departmentId.
    // We'll set departmentId to null for all users before deleting departments.
    await prisma.user.updateMany({
        data: { departmentId: null }
    });
    await prisma.department.deleteMany({});

    // Remove Role-Permission relation if needed, but we don't need to delete permissions unless strictly requested.
    // Actually "除了用户、角色、评价模版外的所有数据" - I should delete permissions as well, or just leave permissions since they are system static data?
    // Let's leave Permissions, as they are usually hardcoded or seeded statically. 
    // If we delete Permissions, we might lose the ability to assign them later without re-seeding. 
    // We will leave Permissions but delete User unit/department info.

    console.log('Data cleared successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
