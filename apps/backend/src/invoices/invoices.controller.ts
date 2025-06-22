import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipeBuilder,
  HttpStatus,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { UploadService } from './upload.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  @Get('stats')
  async getStats(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoicesService.getStats(req.user.userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      clientId,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|jpeg|jpg|png|doc|docx)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    const createInvoiceDto: CreateInvoiceDto = {
      workHourIds: Array.isArray(body.workHourIds)
        ? body.workHourIds
        : [body.workHourIds],
      clientId: body.clientId,
      fileUrl: file.filename,
      amount: parseFloat(body.amount) || 0,
    };

    return this.invoicesService.create(createInvoiceDto, req.user.userId);
  }

  @Post('create-with-file')
  @UseInterceptors(FileInterceptor('file'))
  async createWithFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|jpg|jpeg|png|doc|docx)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body()
    createData: {
      workHourIds: string | string[];
      clientId: string;
      amount: number;
    },
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Create invoice first, then upload file separately
    const createInvoiceDto: CreateInvoiceDto = {
      workHourIds: Array.isArray(createData.workHourIds)
        ? createData.workHourIds
        : [createData.workHourIds],
      clientId: createData.clientId,
      amount: createData.amount || 0,
    };

    const invoice = await this.invoicesService.create(
      createInvoiceDto,
      req.user.userId,
    );

    // Upload file to the created invoice
    const result = await this.invoicesService.uploadFileToInvoice(
      invoice.id,
      file,
      req.user.userId,
    );

    return result;
  }

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(createInvoiceDto, req.user.userId);
  }

  @Get()
  async findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, req.user.userId);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToInvoice(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    console.log(`🔍 Upload attempt for invoice ${id}`);
    console.log(`📁 File details:`, {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    try {
      const result = await this.invoicesService.uploadFileToInvoice(
        id,
        file,
        req.user.userId,
      );
      console.log(`✅ Upload successful for invoice ${id}`);
      return result;
    } catch (error) {
      console.error(`❌ Upload failed for invoice ${id}:`, error.message);
      throw error;
    }
  }

  @Get('file/:userId/:filename')
  async serveFile(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const uploadInfo = this.uploadService.getUploadInfo();
      let filepath: string;

      if (uploadInfo.storage === 'railway') {
        // Railway Volume path
        const railwayVolumePath = this.configService.get(
          'RAILWAY_VOLUME_PATH',
          '/app/data',
        );
        filepath = path.join(
          railwayVolumePath,
          'uploads',
          'invoices',
          userId,
          filename,
        );
      } else if (uploadInfo.storage === 's3') {
        // For S3, we should redirect to the S3 URL instead of serving locally
        // This endpoint shouldn't be used for S3 files
        throw new NotFoundException(
          'File not found - S3 files served directly',
        );
      } else {
        // Local storage path
        filepath = path.join(
          process.cwd(),
          'uploads',
          'invoices',
          userId,
          filename,
        );
      }

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        throw new NotFoundException('File not found');
      }

      // Send file
      res.sendFile(filepath);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  @Get('upload-info')
  async getUploadInfo() {
    return this.uploadService.getUploadInfo();
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.userId);
  }
}
