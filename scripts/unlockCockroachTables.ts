import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to CockroachDB...');
  try {
    const tables: { table_name: string }[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    console.log(`Found ${tables.length} tables in public schema:`, tables.map(t => t.table_name));

    for (const { table_name } of tables) {
      try {
        console.log(`Unlocking schema for table "${table_name}"...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table_name}" SET (schema_locked = false);`);
        console.log(`Successfully unlocked "${table_name}".`);
      } catch (err: any) {
        console.warn(`Could not unlock "${table_name}": ${err.message}`);
      }
    }

    console.log('All public tables unlocked successfully.');
  } catch (error) {
    console.error('Error in unlock script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
