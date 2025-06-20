import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash da senha "123456" para testing
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Criar usuário fictício com o email que você está usando
  const user = await prisma.user.create({
    data: {
      email: 'gustavolendimuth@msn.com',
      name: 'Gustavo Lendimuth',
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.email} with password: 123456`);

  // Criar clientes fictícios
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+55 11 99999-9999',
        company: 'Acme Corporation',
        userId: user.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Tech Solutions Ltd',
        email: 'info@techsolutions.com',
        phone: '+55 11 88888-8888',
        company: 'Tech Solutions Ltd',
        userId: user.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Global Industries',
        email: 'contact@globalind.com',
        phone: '+55 11 77777-7777',
        company: 'Global Industries Inc',
        userId: user.id,
      },
    }),
  ]);

  // Criar projetos fictícios
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        clientId: clients[0].id,
        userId: user.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'iOS and Android mobile application',
        clientId: clients[1].id,
        userId: user.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'System Integration',
        description: 'ERP system integration project',
        clientId: clients[2].id,
        userId: user.id,
      },
    }),
  ]);

  // Criar horas trabalhadas fictícias para testing da funcionalidade de invoices
  const workHours = [];

  // Horas para projeto 1 (Website Redesign)
  for (let i = 0; i < 5; i++) {
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(2025, 5, 10 + i), // Junho 2025
        description: `Website redesign work - Day ${i + 1}`,
        hours: Math.random() * 4 + 4, // Entre 4 e 8 horas
        userId: user.id,
        clientId: clients[0].id,
        projectId: projects[0].id,
      },
    });
    workHours.push(workHour);
  }

  // Horas para projeto 2 (Mobile App)
  for (let i = 0; i < 4; i++) {
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(2025, 5, 15 + i), // Junho 2025
        description: `Mobile app development - Sprint ${i + 1}`,
        hours: Math.random() * 3 + 5, // Entre 5 e 8 horas
        userId: user.id,
        clientId: clients[1].id,
        projectId: projects[1].id,
      },
    });
    workHours.push(workHour);
  }

  // Horas para projeto 3 (System Integration)
  for (let i = 0; i < 3; i++) {
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(2025, 5, 20 + i), // Junho 2025
        description: `System integration work - Phase ${i + 1}`,
        hours: Math.random() * 2 + 6, // Entre 6 e 8 horas
        userId: user.id,
        clientId: clients[2].id,
        projectId: projects[2].id,
      },
    });
    workHours.push(workHour);
  }

  // Criar configurações fictícias
  await prisma.settings.create({
    data: {
      userId: user.id,
      alertHours: 160,
      notificationEmail: 'gustavolendimuth@msn.com',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📧 User: ${user.email}`);
  console.log(`🔑 Password: 123456`);
  console.log(`👥 Created ${clients.length} clients`);
  console.log(`📋 Created ${projects.length} projects`);
  console.log(`⏰ Created ${workHours.length} work hour entries`);
  console.log('🚀 Ready to test invoice creation with multiple work hours!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
