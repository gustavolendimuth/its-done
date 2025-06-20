import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PublicInvoicesController } from './public-invoices.controller';
import { UploadService } from './upload.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        console.log(
          `🔍 Global filter checking file: ${file.originalname}, MIME: ${file.mimetype}`,
        );

        // Accept PDF, images, and Word documents
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ];

        // Also check file extensions as fallback
        const allowedExtensions = [
          '.pdf',
          '.doc',
          '.docx',
          '.jpg',
          '.jpeg',
          '.png',
        ];
        const fileExtension = file.originalname
          .toLowerCase()
          .substring(file.originalname.lastIndexOf('.'));

        if (
          allowedMimeTypes.includes(file.mimetype) ||
          allowedExtensions.includes(fileExtension)
        ) {
          console.log(`✅ File accepted: ${file.originalname}`);
          cb(null, true);
        } else {
          console.error(
            `❌ File rejected: ${file.originalname}, MIME: ${file.mimetype}`,
          );
          cb(
            new Error(
              `Only PDF, images (JPEG, JPG, PNG), and Word documents (DOC, DOCX) are allowed! Received: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  ],
  providers: [InvoicesService, UploadService],
  controllers: [InvoicesController, PublicInvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
