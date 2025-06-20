import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * 🔍 Script de Extração de Dados do Banco
 *
 * Este script extrai todos os dados do banco de dados atual
 * e gera um arquivo seed-production.ts atualizado.
 *
 * Execute: npx tsx scripts/extract-database.ts
 *
 * ⚠️ Use apenas quando necessário para backup/restore
 */

interface ExtractedData {
  users: any[];
  clients: any[];
  projects: any[];
  workHours: any[];
  invoices: any[];
  invoiceWorkHours: any[];
  addresses: any[];
  settings: any[];
  notificationLogs: any[];
}

async function extractAllData(): Promise<ExtractedData> {
  console.log('🔍 Extraindo dados do banco de dados...');

  try {
    const [
      users,
      clients,
      projects,
      workHours,
      invoices,
      invoiceWorkHours,
      addresses,
      settings,
      notificationLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.client.findMany(),
      prisma.project.findMany(),
      prisma.workHour.findMany(),
      prisma.invoice.findMany(),
      prisma.invoiceWorkHour.findMany(),
      prisma.address.findMany(),
      prisma.settings.findMany(),
      prisma.notificationLog.findMany(),
    ]);

    console.log('📊 Dados extraídos:');
    console.log(`  👥 Usuários: ${users.length}`);
    console.log(`  🏢 Clientes: ${clients.length}`);
    console.log(`  📋 Projetos: ${projects.length}`);
    console.log(`  ⏰ Horas de trabalho: ${workHours.length}`);
    console.log(`  💰 Faturas: ${invoices.length}`);
    console.log(`  🔗 Relações fatura-horas: ${invoiceWorkHours.length}`);
    console.log(`  📍 Endereços: ${addresses.length}`);
    console.log(`  ⚙️ Configurações: ${settings.length}`);
    console.log(`  📢 Logs de notificação: ${notificationLogs.length}`);

    return {
      users,
      clients,
      projects,
      workHours,
      invoices,
      invoiceWorkHours,
      addresses,
      settings,
      notificationLogs,
    };
  } catch (error) {
    console.error('❌ Erro na extração:', error);
    throw error;
  }
}

function generateProductionSeed(data: ExtractedData): string {
  const {
    users,
    clients,
    projects,
    workHours,
    invoices,
    invoiceWorkHours,
    addresses,
    settings,
  } = data;

  let content = `import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * 🌱 Seed de Produção - Gerado automaticamente
 * 
 * Gerado em: ${new Date().toISOString()}
 * Dados extraídos do banco de produção
 * 
 * ⚠️ ATENÇÃO: Contém dados reais de produção!
 * Use apenas em ambientes seguros.
 */

async function main() {
  console.log('🌱 Iniciando seed de produção...');
  console.log('📅 Gerado em: ${new Date().toLocaleString('pt-BR')}');
  
  try {
    // Verificar dados existentes
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      console.log(\`⚠️ Encontrados \${existingUsers} usuários no banco.\`);
      console.log('💡 Para substituir, descomente a limpeza abaixo.');
      
      // Limpeza opcional (CUIDADO!)
      // await clearExistingData();
    }

`;

  // Gerar usuários
  users.forEach((user: any, index: number) => {
    const userVar = `user${index + 1}`;
    content += `
    // 👤 Usuário ${index + 1}: ${user.email}
    const ${userVar} = await prisma.user.upsert({
      where: { email: '${user.email}' },
      update: {},
      create: {
        id: '${user.id}',
        email: '${user.email}',
        name: '${user.name.replace(/'/g, "\\'")}',
        password: '${user.password}',
        ${user.googleId ? `googleId: '${user.googleId}',` : ''}
        createdAt: new Date('${user.createdAt.toISOString()}'),
        updatedAt: new Date('${user.updatedAt.toISOString()}'),
      },
    });
`;
  });

  // Gerar configurações
  settings.forEach((setting: any) => {
    const userIndex = users.findIndex((u: any) => u.id === setting.userId) + 1;
    content += `
    await prisma.settings.upsert({
      where: { userId: user${userIndex}.id },
      update: {},
      create: {
        id: '${setting.id}',
        userId: user${userIndex}.id,
        alertHours: ${setting.alertHours},
        ${setting.notificationEmail ? `notificationEmail: '${setting.notificationEmail}',` : ''}
        createdAt: new Date('${setting.createdAt.toISOString()}'),
        updatedAt: new Date('${setting.updatedAt.toISOString()}'),
      },
    });
`;
  });

  // Gerar clientes
  clients.forEach((client: any, index: number) => {
    const clientVar = `client${index + 1}`;
    const userIndex = users.findIndex((u: any) => u.id === client.userId) + 1;

    content += `
    // 🏢 Cliente ${index + 1}: ${client.company}
    const ${clientVar} = await prisma.client.upsert({
      where: { id: '${client.id}' },
      update: {},
      create: {
        id: '${client.id}',
        ${client.name ? `name: '${client.name.replace(/'/g, "\\'")}',` : ''}
        email: '${client.email}',
        ${client.phone ? `phone: '${client.phone}',` : ''}
        company: '${client.company.replace(/'/g, "\\'")}',
        userId: user${userIndex}.id,
        createdAt: new Date('${client.createdAt.toISOString()}'),
        updatedAt: new Date('${client.updatedAt.toISOString()}'),
      },
    });
`;
  });

  // Gerar endereços
  addresses.forEach((address: any) => {
    const clientIndex =
      clients.findIndex((c: any) => c.id === address.clientId) + 1;
    content += `
    await prisma.address.upsert({
      where: { id: '${address.id}' },
      update: {},
      create: {
        id: '${address.id}',
        street: '${address.street.replace(/'/g, "\\'")}',
        city: '${address.city.replace(/'/g, "\\'")}',
        state: '${address.state.replace(/'/g, "\\'")}',
        zipCode: '${address.zipCode}',
        country: '${address.country}',
        type: '${address.type}',
        isPrimary: ${address.isPrimary},
        clientId: client${clientIndex}.id,
        createdAt: new Date('${address.createdAt.toISOString()}'),
        updatedAt: new Date('${address.updatedAt.toISOString()}'),
      },
    });
`;
  });

  // Gerar projetos
  projects.forEach((project: any, index: number) => {
    const projectVar = `project${index + 1}`;
    const clientIndex =
      clients.findIndex((c: any) => c.id === project.clientId) + 1;
    const userIndex = users.findIndex((u: any) => u.id === project.userId) + 1;

    content += `
    // 📋 Projeto ${index + 1}: ${project.name}
    const ${projectVar} = await prisma.project.upsert({
      where: { id: '${project.id}' },
      update: {},
      create: {
        id: '${project.id}',
        name: '${project.name.replace(/'/g, "\\'")}',
        ${project.description ? `description: '${project.description.replace(/'/g, "\\'")}',` : ''}
        clientId: client${clientIndex}.id,
        userId: user${userIndex}.id,
        createdAt: new Date('${project.createdAt.toISOString()}'),
        updatedAt: new Date('${project.updatedAt.toISOString()}'),
      },
    });
`;
  });

  // Gerar horas trabalhadas
  content += `
    // ⏰ Registros de horas trabalhadas
    const workHoursData = [
`;

  workHours.forEach((workHour: any) => {
    const clientIndex =
      clients.findIndex((c: any) => c.id === workHour.clientId) + 1;
    const userIndex = users.findIndex((u: any) => u.id === workHour.userId) + 1;
    const projectIndex = workHour.projectId
      ? projects.findIndex((p: any) => p.id === workHour.projectId) + 1
      : null;

    content += `      {
        id: '${workHour.id}',
        date: new Date('${workHour.date.toISOString()}'),
        ${workHour.description ? `description: '${workHour.description.replace(/'/g, "\\'")}',` : ''}
        hours: ${workHour.hours},
        userId: user${userIndex}.id,
        clientId: client${clientIndex}.id,
        ${projectIndex ? `projectId: project${projectIndex}.id,` : ''}
        createdAt: new Date('${workHour.createdAt.toISOString()}'),
        updatedAt: new Date('${workHour.updatedAt.toISOString()}'),
      },
`;
  });

  content += `    ];

    for (const workHourData of workHoursData) {
      await prisma.workHour.upsert({
        where: { id: workHourData.id },
        update: {},
        create: workHourData,
      });
    }
`;

  // Gerar faturas
  if (invoices.length > 0) {
    content += `
    // 💰 Faturas
`;
    invoices.forEach((invoice: any, index: number) => {
      const invoiceVar = `invoice${index + 1}`;
      const clientIndex =
        clients.findIndex((c: any) => c.id === invoice.clientId) + 1;

      content += `
    const ${invoiceVar} = await prisma.invoice.upsert({
      where: { id: '${invoice.id}' },
      update: {},
      create: {
        id: '${invoice.id}',
        ${invoice.number ? `number: '${invoice.number}',` : ''}
        clientId: client${clientIndex}.id,
        ${invoice.fileUrl ? `fileUrl: '${invoice.fileUrl}',` : ''}
        amount: ${invoice.amount},
        status: '${invoice.status}',
        ${invoice.description ? `description: '${invoice.description.replace(/'/g, "\\'")}',` : ''}
        createdAt: new Date('${invoice.createdAt.toISOString()}'),
        updatedAt: new Date('${invoice.updatedAt.toISOString()}'),
      },
    });
`;
    });

    // Gerar relações fatura-horas
    if (invoiceWorkHours.length > 0) {
      content += `
    // 🔗 Relações Fatura-Horas
`;
      invoiceWorkHours.forEach((relation: any) => {
        const invoiceIndex =
          invoices.findIndex((i: any) => i.id === relation.invoiceId) + 1;
        const workHourIndex =
          workHours.findIndex((w: any) => w.id === relation.workHourId) + 1;

        content += `
    await prisma.invoiceWorkHour.upsert({
      where: { id: '${relation.id}' },
      update: {},
      create: {
        id: '${relation.id}',
        invoiceId: invoice${invoiceIndex}.id,
        workHourId: workHoursData[${workHourIndex - 1}].id,
        createdAt: new Date('${relation.createdAt.toISOString()}'),
      },
    });
`;
      });
    }
  }

  content += `
    console.log('✅ Seed de produção concluído!');
    console.log(\`👥 Usuários: \${${users.length}}\`);
    console.log(\`🏢 Clientes: \${${clients.length}}\`);
    console.log(\`📋 Projetos: \${${projects.length}}\`);
    console.log(\`⏰ Horas de trabalho: \${${workHours.length}}\`);
    console.log(\`💰 Faturas: \${${invoices.length}}\`);
    console.log(\`📍 Endereços: \${${addresses.length}}\`);
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
`;

  return content;
}

async function main() {
  try {
    console.log('🚀 Iniciando extração de dados...\n');

    // Extrair dados
    const data = await extractAllData();

    // Gerar arquivo seed
    const seedContent = generateProductionSeed(data);
    const seedPath = path.join(__dirname, '..', 'prisma', 'seed-production.ts');

    // Backup do arquivo atual se existir
    if (fs.existsSync(seedPath)) {
      const backupPath = `${seedPath}.backup.${Date.now()}`;
      fs.copyFileSync(seedPath, backupPath);
      console.log(`📦 Backup criado: ${path.basename(backupPath)}`);
    }

    // Escrever novo arquivo
    fs.writeFileSync(seedPath, seedContent);
    console.log(`✅ Seed atualizado: ${path.basename(seedPath)}`);

    console.log('\n🎉 Extração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Revisar o arquivo gerado: prisma/seed-production.ts');
    console.log('2. Testar: pnpm db:seed:prod');
    console.log('3. Usar em outros ambientes conforme necessário');
  } catch (error) {
    console.error('❌ Falha na extração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
