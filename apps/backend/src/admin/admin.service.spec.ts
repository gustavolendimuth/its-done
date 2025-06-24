import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    client: {
      count: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    workHour: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      mockPrismaService.user.count.mockResolvedValueOnce(10); // total users
      mockPrismaService.client.count.mockResolvedValue(5);
      mockPrismaService.project.count.mockResolvedValue(8);
      mockPrismaService.workHour.count.mockResolvedValue(100);
      mockPrismaService.invoice.count.mockResolvedValueOnce(20); // total invoices
      mockPrismaService.invoice.count.mockResolvedValueOnce(10); // pending
      mockPrismaService.invoice.count.mockResolvedValueOnce(8); // paid
      mockPrismaService.invoice.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      });
      mockPrismaService.user.count.mockResolvedValueOnce(2); // admin users
      mockPrismaService.user.count.mockResolvedValueOnce(8); // regular users
      mockPrismaService.workHour.aggregate.mockResolvedValue({
        _sum: { hours: 850.5 },
      });

      const result = await service.getSystemStats();

      expect(result).toEqual({
        users: {
          total: 10,
          admins: 2,
          regular: 8,
        },
        clients: 5,
        projects: 8,
        workHours: {
          total: 100,
          totalHours: 850.5,
        },
        invoices: {
          total: 20,
          pending: 10,
          paid: 8,
        },
        revenue: 5000,
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const userId = 'user-id';
      const newRole = 'ADMIN';
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: newRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole(userId, newRole);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a regular user', async () => {
      const userId = 'user-id';
      mockPrismaService.user.count.mockResolvedValue(2); // 2 admins
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'USER',
      });
      mockPrismaService.user.delete.mockResolvedValue({ id: userId });

      await service.deleteUser(userId);

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should not delete the last admin user', async () => {
      const userId = 'admin-id';
      mockPrismaService.user.count.mockResolvedValue(1); // Only 1 admin
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'ADMIN',
      });

      await expect(service.deleteUser(userId)).rejects.toThrow(
        'Cannot delete the last admin user',
      );
    });
  });
});
