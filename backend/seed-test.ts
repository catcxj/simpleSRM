import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test suppliers and fixing roles...');

    // 1. Fix roles to have 'read:suppliers'
    const matRole = await prisma.role.findFirst({ where: { name: 'Material Viewer' } });
    if (matRole) {
        await prisma.role.update({
            where: { id: matRole.id },
            data: {
                permissions: {
                    create: [{ resource: 'suppliers', action: 'read' }]
                },
                businessTypes: JSON.stringify(['Material'])
            }
        });
        console.log('Fixed Material Viewer role.');
    }

    const constRole = await prisma.role.findFirst({ where: { name: 'Construction Manager' } });
    if (constRole) {
        await prisma.role.update({
            where: { id: constRole.id },
            data: {
                permissions: {
                    create: [{ resource: 'suppliers', action: 'read' }]
                },
                businessTypes: JSON.stringify(['Construction'])
            }
        });
        console.log('Fixed Construction Manager role.');
    }

    // 2. Add test suppliers
    const matSupplier = await prisma.supplier.create({
        data: {
            name: 'Test Material Supplier 1',
            businessType: 'Material',
            status: 'Active',
            contacts: {
                create: [{ name: 'Mat Contact', phone: '123' }]
            }
        }
    });
    console.log('Created Material test supplier:', matSupplier.name);

    const constSupplier = await prisma.supplier.create({
        data: {
            name: 'Test Construction Supplier 1',
            businessType: 'Construction',
            status: 'Active',
            contacts: {
                create: [{ name: 'Const Contact', phone: '456' }]
            }
        }
    });
    console.log('Created Construction test supplier:', constSupplier.name);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
