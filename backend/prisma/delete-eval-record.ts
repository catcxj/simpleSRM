import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteEvaluationData(recordId: string) {
  try {
    // 测试是否能连接到数据库
    await prisma.$connect();
    
    // 检查记录是否存在
    const record = await prisma.evaluationRecord.findUnique({
      where: { id: recordId },
      include: {
        details: true,
      }
    });

    if (!record) {
      console.log(`[不存在] 未找到 ID 为 [${recordId}] 的评价数据(EvaluationRecord)。`);
      return;
    }

    const detailCount = record.details.length;
    console.log(`[信息] 找到评价数据 ID: ${recordId}`);
    console.log(`[信息] 该数据包含 ${detailCount} 条详情(EvaluationDetail)记录。准备执行彻底删除...`);

    // 删除评价数据主体
    // 配置了 onDelete: Cascade，因此相关的 EvaluationDetail 也会在数据库层面一起删除。
    // 如果想要在 Prisma 层面更显式地确保删除，可以采用事务：
    await prisma.$transaction([
      // 1. 删除子表数据（如果数据库有级联约束，可以不加，但显式加比较稳妥）
      prisma.evaluationDetail.deleteMany({
        where: { recordId: recordId },
      }),
      // 2. 删除主表数据
      prisma.evaluationRecord.delete({
        where: { id: recordId },
      })
    ]);

    console.log(`[成功] 已彻底删除评价数据 ID: ${recordId} 及其关联的 ${detailCount} 条评价详情。`);
  } catch (error) {
    console.error(`[错误] 删除执行失败，请检查 ID 格式相关异常:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('--- 评价数据删除工具 ---');
    console.log('使用方法:');
    console.log('  npx ts-node delete-eval-record.ts <记录ID>');
    console.log('示例:');
    console.log('  npx ts-node delete-eval-record.ts "123e4567-e89b-12d3-a456-426614174000"');
    console.log('------------------------');
    process.exit(1);
  }

  const recordId = args[0];
  await deleteEvaluationData(recordId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
