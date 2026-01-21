import { registerAs } from '@nestjs/config'

export interface FilesConfig {
  uploadPath: string
  uploadsDir: string
  maxFileSize: number
}

export const filesConfig = registerAs(
  'files',
  (): FilesConfig => ({
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    uploadsDir: process.env.UPLOADS_DIR || './uploads/',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  }),
)
