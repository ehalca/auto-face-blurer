import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { rm, rmSync } from 'fs';
import { getBatch, getBatchFolders } from './app.service';
import { BlurWorkerManager } from './blur-worker-manager.service';

@Injectable()
export class CleanerService {
  retention = Number(process.env.RETENTION) || 1000 * 60 * 15;

  constructor(private readonly blurWorkerManager:BlurWorkerManager) {}


  @Cron(process.env.DELETE_TIME || CronExpression.EVERY_10_MINUTES)
  clean() {
    
    const batchFolders = getBatchFolders();
    const now = new Date().getTime();
    const batches = batchFolders.filter(f=>!this.blurWorkerManager.isWorking(f)).forEach((folder) => {
      const batch = getBatch(folder);
      if ((now - parseInt(batch.time)) > this.retention) {
        rmSync(batch.batchFolder, { recursive: true, force: true });
        this.blurWorkerManager.events.next({ type: 'message', data: { batchFolder: folder, deleted: true } });
      }
    });
  }
}
