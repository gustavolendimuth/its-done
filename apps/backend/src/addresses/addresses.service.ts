import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    // Verify that the client belongs to the user
    const client = await this.prisma.client.findFirst({
      where: {
        id: createAddressDto.clientId,
        userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // If this is set as primary, unset other primary addresses for this client
    if (createAddressDto.isPrimary) {
      await this.prisma.address.updateMany({
        where: {
          clientId: createAddressDto.clientId,
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
        client: {
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

  async findAll(userId: string, clientId?: string) {
    const where: any = {};

    if (clientId) {
      // Verify that the client belongs to the user
      const client = await this.prisma.client.findFirst({
        where: {
          id: clientId,
          userId,
        },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      where.clientId = clientId;
    } else {
      // If no clientId specified, get addresses for all user's clients
      where.client = {
        userId,
      };
    }

    return this.prisma.address.findMany({
      where,
      include: {
        client: {
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
        client: {
          userId,
        },
      },
      include: {
        client: {
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

    // If this is being set as primary, unset other primary addresses for this client
    if (updateAddressDto.isPrimary) {
      await this.prisma.address.updateMany({
        where: {
          clientId: address.clientId,
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
        client: {
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

  async findByClient(userId: string, clientId: string) {
    // Verify that the client belongs to the user
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.prisma.address.findMany({
      where: { clientId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setPrimary(userId: string, id: string) {
    const address = await this.findOne(userId, id);

    // Unset other primary addresses for this client
    await this.prisma.address.updateMany({
      where: {
        clientId: address.clientId,
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
        client: {
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
