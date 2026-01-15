import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  // Upsert admin user
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin',
      email: 'admin@local',
    },
    create: {
      username: 'admin',
      email: 'admin@local',
      passwordHash: adminPasswordHash,
      displayName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      rankCode: 'BRONZE',
    },
  });
  console.log('✅ Admin user upserted:', admin.username);

  // Hash password once for all regular users
  const userPasswordHash = await bcrypt.hash('123456', saltRounds);

  // Rank codes to distribute evenly
  const rankCodes: ('BRONZE' | 'SILVER' | 'GOLD')[] = ['BRONZE', 'SILVER', 'GOLD'];

  // Upsert 100 users
  console.log('📦 Creating 100 users...');
  const userPromises: Promise<User>[] = [];

  for (let i = 1; i <= 100; i++) {
    const username = `user${i}`;
    const rankCode = rankCodes[(i - 1) % 3]; // Distribute evenly: BRONZE, SILVER, GOLD

    userPromises.push(
      prisma.user.upsert({
        where: { username },
        update: {
          passwordHash: userPasswordHash,
          rankCode,
          status: 'ACTIVE',
          displayName: `User ${i}`,
          email: `${username}@local`,
        },
        create: {
          username,
          email: `${username}@local`,
          passwordHash: userPasswordHash,
          displayName: `User ${i}`,
          rankCode,
          status: 'ACTIVE',
          role: 'USER',
        },
      }),
    );
  }

  const users = await Promise.all(userPromises);
  console.log(`✅ ${users.length} users upserted successfully`);

  // Summary
  const bronzeCount = users.filter((u) => u.rankCode === 'BRONZE').length;
  const silverCount = users.filter((u) => u.rankCode === 'SILVER').length;
  const goldCount = users.filter((u) => u.rankCode === 'GOLD').length;

  console.log('\n📊 Summary:');
  console.log(`   Admin: 1`);
  console.log(`   Users: ${users.length}`);
  console.log(`   - BRONZE: ${bronzeCount}`);
  console.log(`   - SILVER: ${silverCount}`);
  console.log(`   - GOLD: ${goldCount}`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

