import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

@Injectable()
export class StorageService {
  private readonly uploadDirectory: string;

  constructor(private readonly configService: ConfigService) {
    const configuredDirectory = this.configService.get<string>('UPLOAD_DIR');

    this.uploadDirectory = resolve(
      configuredDirectory ?? resolve(process.cwd(), 'uploads'),
    );
  }

  async save(userId: string, file: Express.Multer.File): Promise<string> {
    const extension = this.getSafeExtension(file.originalname);

    const storageKey = `${userId}/${randomUUID()}${extension}`;
    const filePath = this.resolveStorageKey(storageKey);

    await mkdir(resolve(filePath, '..'), {
      recursive: true,
    });

    await writeFile(filePath, file.buffer);

    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveStorageKey(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await unlink(this.resolveStorageKey(storageKey));
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
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
