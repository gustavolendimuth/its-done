/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * 🌱 Seed de Produção - Gerado automaticamente
 *
 * Gerado em: 2025-06-24T21:30:43.032Z
 * Dados extraídos do banco de produção
 *
 * ⚠️ ATENÇÃO: Contém dados reais de produção!
 * Use apenas em ambientes seguros.
 */

async function main() {
  console.log('🌱 Iniciando seed de produção...');
  console.log('📅 Gerado em: 24/06/2025, 18:30:43');

  try {
    // Verificar dados existentes
    const existingUsers = await prisma.user.count();

    if (existingUsers > 0) {
      console.log(`⚠️ Encontrados ${existingUsers} usuários no banco.`);
      console.log('💡 Para substituir, descomente a limpeza abaixo.');

      // Limpeza opcional (CUIDADO!)
      // await clearExistingData();
    }

    // 👤 Usuário 1: gustavolendimuth@gmail.com
    const user1 = await prisma.user.upsert({
      where: { email: 'gustavolendimuth@gmail.com' },
      update: {},
      create: {
        id: 'e7bd5602-b138-4971-ab87-e60e977e83c5',
        email: 'gustavolendimuth@gmail.com',
        name: 'Gustavo Lendimuth',
        password:
          '$2b$10$pt7xYp2W0Oa/DZVh9YJ6eOBRshnh6FTjOSqgaQ4r6FMnFf/MWxyLi',
        googleId: '114995071404776384821',
        createdAt: new Date('2025-06-24T21:29:58.597Z'),
        updatedAt: new Date('2025-06-24T21:29:58.597Z'),
      },
    });

    // 👤 Usuário 2: gustavolendimuth@msn.com
    const user2 = await prisma.user.upsert({
      where: { email: 'gustavolendimuth@msn.com' },
      update: {},
      create: {
        id: '3ae09c23-4dfc-42b9-b873-b4875e4bf4fc',
        email: 'gustavolendimuth@msn.com',
        name: 'Gustavo Lendimuth',
        password:
          '$2b$10$zYKwi64GbvEqWjQo/6U83ef3FdyJZ5IbFbbW6kkR5ZIlwdg8vPFrW',

        createdAt: new Date('2025-06-24T21:24:26.571Z'),
        updatedAt: new Date('2025-06-24T21:24:26.571Z'),
      },
    });

    await prisma.settings.upsert({
      where: { userId: user1.id },
      update: {},
      create: {
        id: '34712ddf-c3cc-42e2-a698-59e67e27f71c',
        userId: user1.id,
        alertHours: 160,
        notificationEmail: 'gustavolendimuth@msn.com',
        createdAt: new Date('2025-06-24T21:24:26.626Z'),
        updatedAt: new Date('2025-06-24T21:24:26.626Z'),
      },
    });

    // 🏢 Cliente 1: Tech Solutions Ltd
    const client1 = await prisma.client.upsert({
      where: { id: 'dd4e9e9c-c5bd-42e8-9229-54a30afe608e' },
      update: {},
      create: {
        id: 'dd4e9e9c-c5bd-42e8-9229-54a30afe608e',
        name: 'Tech Solutions Ltd',
        email: 'info@techsolutions.com',
        phone: '+55 11 88888-8888',
        company: 'Tech Solutions Ltd',
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.578Z'),
        updatedAt: new Date('2025-06-24T21:24:26.578Z'),
      },
    });

    // 🏢 Cliente 2: Acme Corporation
    const client2 = await prisma.client.upsert({
      where: { id: '12f9c109-2ed5-42e9-8a27-f554faa6ace9' },
      update: {},
      create: {
        id: '12f9c109-2ed5-42e9-8a27-f554faa6ace9',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+55 11 99999-9999',
        company: 'Acme Corporation',
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.578Z'),
        updatedAt: new Date('2025-06-24T21:24:26.578Z'),
      },
    });

    // 🏢 Cliente 3: Global Industries Inc
    const client3 = await prisma.client.upsert({
      where: { id: '30221f80-270d-428c-830f-99eb10b6d56f' },
      update: {},
      create: {
        id: '30221f80-270d-428c-830f-99eb10b6d56f',
        name: 'Global Industries',
        email: 'contact@globalind.com',
        phone: '+55 11 77777-7777',
        company: 'Global Industries Inc',
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.578Z'),
        updatedAt: new Date('2025-06-24T21:24:26.578Z'),
      },
    });

    // 📋 Projeto 1: Mobile App Development
    const project1 = await prisma.project.upsert({
      where: { id: '85371e6d-7b65-4ea0-a554-13593c2705c6' },
      update: {},
      create: {
        id: '85371e6d-7b65-4ea0-a554-13593c2705c6',
        name: 'Mobile App Development',
        description: 'iOS and Android mobile application',
        clientId: client1.id,
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.591Z'),
        updatedAt: new Date('2025-06-24T21:24:26.591Z'),
      },
    });

    // 📋 Projeto 2: Website Redesign
    const project2 = await prisma.project.upsert({
      where: { id: '8b368808-4f2f-401d-affb-4cb469e3c72a' },
      update: {},
      create: {
        id: '8b368808-4f2f-401d-affb-4cb469e3c72a',
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        clientId: client2.id,
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.591Z'),
        updatedAt: new Date('2025-06-24T21:24:26.591Z'),
      },
    });

    // 📋 Projeto 3: System Integration
    const project3 = await prisma.project.upsert({
      where: { id: '4a7ab0af-f15c-4e6a-aff3-f3437a66d3d8' },
      update: {},
      create: {
        id: '4a7ab0af-f15c-4e6a-aff3-f3437a66d3d8',
        name: 'System Integration',
        description: 'ERP system integration project',
        clientId: client3.id,
        userId: user1.id,
        createdAt: new Date('2025-06-24T21:24:26.591Z'),
        updatedAt: new Date('2025-06-24T21:24:26.591Z'),
      },
    });

    // ⏰ Registros de horas trabalhadas
    const workHoursData = [
      {
        id: '3ba28327-60bd-4991-9244-0312225c4430',
        date: new Date('2025-06-10T03:00:00.000Z'),
        description: 'Website redesign work - Day 1',
        hours: 7.660015939046612,
        userId: user1.id,
        clientId: client2.id,
        projectId: project2.id,
        createdAt: new Date('2025-06-24T21:24:26.596Z'),
        updatedAt: new Date('2025-06-24T21:24:26.596Z'),
      },
      {
        id: '34985ef1-a9d7-448d-adb7-875eb1907b69',
        date: new Date('2025-06-11T03:00:00.000Z'),
        description: 'Website redesign work - Day 2',
        hours: 7.336545569770136,
        userId: user1.id,
        clientId: client2.id,
        projectId: project2.id,
        createdAt: new Date('2025-06-24T21:24:26.601Z'),
        updatedAt: new Date('2025-06-24T21:24:26.601Z'),
      },
      {
        id: '2320d4c2-f835-4a1f-b0cd-54f77d01b419',
        date: new Date('2025-06-12T03:00:00.000Z'),
        description: 'Website redesign work - Day 3',
        hours: 5.782418395679951,
        userId: user1.id,
        clientId: client2.id,
        projectId: project2.id,
        createdAt: new Date('2025-06-24T21:24:26.605Z'),
        updatedAt: new Date('2025-06-24T21:24:26.605Z'),
      },
      {
        id: '0c217182-219c-419c-aad2-f92f42514775',
        date: new Date('2025-06-13T03:00:00.000Z'),
        description: 'Website redesign work - Day 4',
        hours: 6.397310851076649,
        userId: user1.id,
        clientId: client2.id,
        projectId: project2.id,
        createdAt: new Date('2025-06-24T21:24:26.608Z'),
        updatedAt: new Date('2025-06-24T21:24:26.608Z'),
      },
      {
        id: 'bd7ce9ea-dfad-4d7f-99cf-c3ed781a3cd0',
        date: new Date('2025-06-14T03:00:00.000Z'),
        description: 'Website redesign work - Day 5',
        hours: 6.488159396226239,
        userId: user1.id,
        clientId: client2.id,
        projectId: project2.id,
        createdAt: new Date('2025-06-24T21:24:26.611Z'),
        updatedAt: new Date('2025-06-24T21:24:26.611Z'),
      },
      {
        id: '97b13d57-f29b-4952-a172-d2db1dd14636',
        date: new Date('2025-06-15T03:00:00.000Z'),
        description: 'Mobile app development - Sprint 1',
        hours: 7.428218765279113,
        userId: user1.id,
        clientId: client1.id,
        projectId: project1.id,
        createdAt: new Date('2025-06-24T21:24:26.613Z'),
        updatedAt: new Date('2025-06-24T21:24:26.613Z'),
      },
      {
        id: '6b547a20-2230-419a-9c6d-035bee127b11',
        date: new Date('2025-06-16T03:00:00.000Z'),
        description: 'Mobile app development - Sprint 2',
        hours: 5.764444971256667,
        userId: user1.id,
        clientId: client1.id,
        projectId: project1.id,
        createdAt: new Date('2025-06-24T21:24:26.616Z'),
        updatedAt: new Date('2025-06-24T21:24:26.616Z'),
      },
      {
        id: '81090ce0-0d9c-4924-95e5-70a226b3ba76',
        date: new Date('2025-06-17T03:00:00.000Z'),
        description: 'Mobile app development - Sprint 3',
        hours: 6.490867951716423,
        userId: user1.id,
        clientId: client1.id,
        projectId: project1.id,
        createdAt: new Date('2025-06-24T21:24:26.618Z'),
        updatedAt: new Date('2025-06-24T21:24:26.618Z'),
      },
      {
        id: 'eb0a9005-69ec-4a4e-b9da-bdbc4b799191',
        date: new Date('2025-06-18T03:00:00.000Z'),
        description: 'Mobile app development - Sprint 4',
        hours: 6.731323961741257,
        userId: user1.id,
        clientId: client1.id,
        projectId: project1.id,
        createdAt: new Date('2025-06-24T21:24:26.619Z'),
        updatedAt: new Date('2025-06-24T21:24:26.619Z'),
      },
      {
        id: 'db181ab6-b9b3-4445-91ff-2b4e7ada6268',
        date: new Date('2025-06-20T03:00:00.000Z'),
        description: 'System integration work - Phase 1',
        hours: 7.154779075915515,
        userId: user1.id,
        clientId: client3.id,
        projectId: project3.id,
        createdAt: new Date('2025-06-24T21:24:26.620Z'),
        updatedAt: new Date('2025-06-24T21:24:26.620Z'),
      },
      {
        id: 'f4fa73e5-b64a-4888-bf86-8985513fb691',
        date: new Date('2025-06-21T03:00:00.000Z'),
        description: 'System integration work - Phase 2',
        hours: 7.592580031295201,
        userId: user1.id,
        clientId: client3.id,
        projectId: project3.id,
        createdAt: new Date('2025-06-24T21:24:26.622Z'),
        updatedAt: new Date('2025-06-24T21:24:26.622Z'),
      },
      {
        id: '40d102da-0e5e-46a6-828e-689b5d43cdc1',
        date: new Date('2025-06-22T03:00:00.000Z'),
        description: 'System integration work - Phase 3',
        hours: 6.845495987856328,
        userId: user1.id,
        clientId: client3.id,
        projectId: project3.id,
        createdAt: new Date('2025-06-24T21:24:26.624Z'),
        updatedAt: new Date('2025-06-24T21:24:26.624Z'),
      },
    ];

    for (const workHourData of workHoursData) {
      await prisma.workHour.upsert({
        where: { id: workHourData.id },
        update: {},
        create: workHourData,
      });
    }

    console.log('✅ Seed de produção concluído!');
    console.log(`👥 Usuários: ${2}`);
    console.log(`🏢 Clientes: ${3}`);
    console.log(`📋 Projetos: ${3}`);
    console.log(`⏰ Horas de trabalho: ${12}`);
    console.log(`💰 Faturas: ${0}`);
    console.log(`📍 Endereços: ${0}`);
    console.log('🚀 Sistema pronto para uso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

/**
 * Limpar dados existentes (CUIDADO!)
 */
async function clearExistingData() {
  console.log('🗑️ Limpando dados existentes...');

  await prisma.invoiceWorkHour.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workHour.deleteMany();
  await prisma.project.deleteMany();
  await prisma.address.deleteMany();
  await prisma.client.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Dados removidos.');
}

main()
  .catch((e) => {
    console.error('❌ Falha no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
