import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    // Verify that the company belongs to the user
    const company = await this.prisma.company.findFirst({
      where: {
        id: createAddressDto.companyId,
        collaborators: { some: { userId } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // If this is set as primary, unset other primary addresses for this company
    if (createAddressDto.isPrimary) {
      await this.prisma.address.updateMany({
        where: {
          companyId: createAddressDto.companyId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        ...createAddressDto,
        country: createAddressDto.country || 'Brazil',
        type: createAddressDto.type || 'billing',
      },
      include: {
        company: {
          select: {
            id: true,
            company: true,
            name: true,
          },
        },
      },
    });

    return address;
  }

  async findAll(userId: string, companyId?: string) {
    const where: any = {};

    if (companyId) {
      // Verify that the company belongs to the user
      const company = await this.prisma.company.findFirst({
        where: {
          id: companyId,
          collaborators: { some: { userId } },
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      where.companyId = companyId;
    } else {
      // If no companyId specified, get addresses for all user's companies
      where.company = {
        collaborators: { some: { userId } },
      };
    }

    return this.prisma.address.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            company: true,
            name: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id,
        company: {
          collaborators: { some: { userId } },
        },
      },
      include: {
        company: {
          select: {
            id: true,
            company: true,
            name: true,
          },
        },
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async update(userId: string, id: string, updateAddressDto: UpdateAddressDto) {
    const address = await this.findOne(userId, id);

    // If this is being set as primary, unset other primary addresses for this company
    if (updateAddressDto.isPrimary) {
      await this.prisma.address.updateMany({
        where: {
          companyId: address.companyId,
          isPrimary: true,
          id: { not: id },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: updateAddressDto,
      include: {
        company: {
          select: {
            id: true,
            company: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.address.delete({
      where: { id },
    });

    return { message: 'Address deleted successfully' };
  }

  async findByClient(userId: string, companyId: string) {
    // Verify that the company belongs to the user
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        collaborators: { some: { userId } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.address.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setPrimary(userId: string, id: string) {
    const address = await this.findOne(userId, id);

    // Unset other primary addresses for this company
    await this.prisma.address.updateMany({
      where: {
        companyId: address.companyId,
        isPrimary: true,
        id: { not: id },
      },
      data: {
        isPrimary: false,
      },
    });

    // Set this address as primary
    return this.prisma.address.update({
      where: { id },
      data: { isPrimary: true },
      include: {
        company: {
          select: {
            id: true,
            company: true,
            name: true,
          },
        },
      },
    });
  }
}
