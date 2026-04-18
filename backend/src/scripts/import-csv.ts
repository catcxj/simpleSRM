
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as path from 'path';

const prisma = new PrismaClient();

async function importCsv() {
    const filePath = "d:\\code\\simpleSRM\\国际数字化业务供应商清单库_供应商资源库总库_供应商.csv";

    console.log(`Reading file from ${filePath}...`);
    if (!fs.existsSync(filePath)) {
        console.error('File not found!');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
        console.error('CSV Parsing errors:', parsed.errors);
    }

    const rows = parsed.data as any[];
    console.log(`Found ${rows.length} rows. Starting import...`);

    let successCount = 0;
    let failCount = 0;

    for (const row of rows) {
        try {
            // Helper to safely get string value
            const getStr = (key: string) => row[key]?.toString()?.trim() || '';

            // Map CSV columns to DTO
            const name = getStr('供应商名称');
            if (!name) continue;

            const businessContent = getStr('业务内容 (业务领域）');
            const businessType = getStr('业务类别');
            const serviceRegion = getStr('服务国别');
            const website = getStr('公司网站');
            const contactName = getStr('联系人');
            const email = getStr('邮箱');
            const phone = getStr('联系电话');
            const position = getStr('职务');
            const city = getStr('城市');
            const address = getStr('公司地址'); // Ensure this column name matches CSV

            // Status mapping
            let status = 'Pending';
            const statusStr = getStr('是否入库');
            if (statusStr.includes('已入库')) status = 'Active';

            // Check if exists
            const existing = await prisma.supplier.findFirst({ where: { name, deletedAt: null } });
            if (existing) {
                console.log(`Skipping existing supplier: ${name}`);
                continue; // Or update?
            }

            // Create
            await prisma.supplier.create({
                data: {
                    name,
                    businessType: businessType || 'Other',
                    industry: businessContent,
                    serviceRegion: serviceRegion,
                    address: address, // This might fail if client is not regenerated
                    status: status,
                    contacts: contactName ? {
                        create: {
                            name: contactName,
                            phone: phone || 'N/A',
                            email: email,
                            position: position,
                            isPrimary: true
                        }
                    } : undefined
                }
            });
            successCount++;
            process.stdout.write('.');
        } catch (e: any) {
            failCount++;
            console.error(`\nFailed to import ${row['供应商名称']}: ${e.message}`);
        }
    }

    console.log(`\nImport finished. Success: ${successCount}, Failed: ${failCount}`);
}

importCsv()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
