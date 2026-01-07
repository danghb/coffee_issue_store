import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { MultipartFile } from '@fastify/multipart';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadService = {
  // 处理文件上传
  async processUpload(file: MultipartFile) {
    const originalFilename = file.filename;
    const extension = path.extname(originalFilename).toLowerCase();
    const filename = `${uuidv4()}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // 保存文件
    await pipeline(file.file, fs.createWriteStream(filepath));

    // 获取文件大小
    const stats = await fs.promises.stat(filepath);
    
    // 确定文件类型
    const kind = this.determineKind(file.mimetype, extension);

    // 保存到数据库
    const attachment = await prisma.attachment.create({
      data: {
        filename: originalFilename,
        path: filename, // 存储相对路径（也就是文件名）
        mimeType: file.mimetype,
        size: stats.size,
        kind: kind,
      }
    });

    return attachment;
  },

  // 根据 MIME 类型或扩展名判断文件类型
  determineKind(mimeType: string, extension: string): string {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    
    const logExtensions = ['.log', '.txt', '.json', '.xml'];
    if (logExtensions.includes(extension)) return 'LOG';
    
    if (extension === '.pcap' || extension === '.pcapng') return 'PCAP';
    if (extension === '.bin' || extension === '.exe' || extension === '.dll') return 'BINARY';
    
    return 'OTHER';
  }
};
