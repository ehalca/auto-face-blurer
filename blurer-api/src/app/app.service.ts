import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  existsSync,
  mkdir,
  mkdirSync,
  readdirSync,
  write,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { BlurWorkerManager } from './blur-worker-manager.service';

export const UPLOAD_FOLDER = join(__dirname, '..', 'uploads');

export const getBatchFolders = () => {
  if (!existsSync(UPLOAD_FOLDER)) {
    return [];
  }
  return readdirSync(UPLOAD_FOLDER);
};

export const getApiPath = (batch: string, input: boolean, file: string) => {
  return join('api', 'uploads', batch, input? 'input':'output', file)
}

export const getBatch = (folder: string) => {
  const [id, time] = folder.split('!');
  const inputFolder = join(UPLOAD_FOLDER, folder, 'input');
  const input = readdirSync(inputFolder);
  const outputFolder = join(UPLOAD_FOLDER, folder, 'output');
  const output = existsSync(outputFolder) ? readdirSync(outputFolder) : [];
  return {
    folder,
    batchFolder: join(UPLOAD_FOLDER, folder),
    id,
    time,
    inputFolder,
    outputFolder,
    input: input.map((i) => getApiPath(folder, true, i)),
    output: output.map((i) => getApiPath(folder, false, i)),
  };
};

@Injectable()
export class AppService {

  constructor(private readonly blurWorkerManager:BlurWorkerManager) {}

  getData(): { message: string } {
    return { message: 'Hello API2' };
  }

  postBatch(files: Array<Express.Multer.File>) {
    const id = randomUUID();
    const time = new Date().getTime();
    const folderName = `${id}!${time}`;
    const folder = join(UPLOAD_FOLDER,folderName, 'input');
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }
    files.forEach((file) => {
      const path = join(folder, file.originalname);
      writeFileSync(path, file.buffer);
    });
    this.blurWorkerManager.processBatch(folderName);
    return getBatch(folderName);
  }

  getBatches() {
    return getBatchFolders().map((folder) => {
      return getBatch(folder);
    });
  }
}
