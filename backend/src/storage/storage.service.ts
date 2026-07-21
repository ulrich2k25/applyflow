import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

type StorageDriver = 'local' | 'cloudinary';

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;
  private readonly uploadDirectory: string;

  constructor(private readonly configService: ConfigService) {
    const configuredDriver =
      this.configService.get<string>('STORAGE_DRIVER') ?? 'local';

    if (configuredDriver !== 'local' && configuredDriver !== 'cloudinary') {
      throw new Error('STORAGE_DRIVER must be "local" or "cloudinary".');
    }

    this.driver = configuredDriver;
    this.uploadDirectory = resolve(
      this.configService.get<string>('UPLOAD_DIR') ??
        resolve(process.cwd(), 'uploads'),
    );

    if (this.driver === 'cloudinary') {
      this.configureCloudinary();
    }
  }

  async save(userId: string, file: Express.Multer.File): Promise<string> {
    const extension = this.getSafeExtension(file.originalname);
    const storageKey = `applyflow/${userId}/${randomUUID()}${extension}`;

    if (this.driver === 'cloudinary') {
      await this.uploadToCloudinary(storageKey, file.buffer);
      return storageKey;
    }

    const filePath = this.resolveStorageKey(storageKey);

    await mkdir(resolve(filePath, '..'), { recursive: true });
    await writeFile(filePath, file.buffer);

    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    if (this.driver === 'cloudinary') {
      const signedUrl = cloudinary.utils.private_download_url(storageKey, '', {
        resource_type: 'raw',
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 60,
        attachment: false,
      });
      const response = await fetch(signedUrl);

      if (!response.ok) {
        throw new Error(`Cloudinary download failed with ${response.status}.`);
      }

      return Buffer.from(await response.arrayBuffer());
    }

    return readFile(this.resolveStorageKey(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    if (this.driver === 'cloudinary') {
      await cloudinary.uploader.destroy(storageKey, {
        resource_type: 'raw',
        type: 'authenticated',
        invalidate: true,
      });
      return;
    }

    try {
      await unlink(this.resolveStorageKey(storageKey));
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  }

  private configureCloudinary(): void {
    const cloudName = this.requireConfig('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.requireConfig('CLOUDINARY_API_KEY');
    const apiSecret = this.requireConfig('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private uploadToCloudinary(
    storageKey: string,
    buffer: Buffer,
  ): Promise<UploadApiResponse> {
    return new Promise((resolveUpload, rejectUpload) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: storageKey,
          resource_type: 'raw',
          type: 'authenticated',
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            rejectUpload(
              new Error(error.message ?? 'Cloudinary upload failed.'),
            );
            return;
          }

          if (!result) {
            rejectUpload(new Error('Cloudinary returned no upload result.'));
            return;
          }

          resolveUpload(result);
        },
      );

      uploadStream.end(buffer);
    });
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`${key} is required when STORAGE_DRIVER=cloudinary.`);
    }

    return value;
  }

  private resolveStorageKey(storageKey: string): string {
    const filePath = resolve(this.uploadDirectory, storageKey);

    if (!filePath.startsWith(`${this.uploadDirectory}${sep}`)) {
      throw new Error('Invalid storage key');
    }

    return filePath;
  }

  private getSafeExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();

    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '';
  }
}
