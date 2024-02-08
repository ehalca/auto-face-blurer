import { Injectable, OnModuleInit, MessageEvent } from '@nestjs/common';
import { getBatch, getBatchFolders } from './app.service';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { URL as NodeURL } from 'url';
import { Subject } from 'rxjs';

@Injectable()
export class BlurWorkerManager implements OnModuleInit {
  workers: Record<string, Worker> = {};
  events = new Subject<MessageEvent>();

  onModuleInit() {
    const stalledBatches = this.getStalledBatches();
    stalledBatches.forEach((batch) => {
      this.processBatch(batch.folder);
    });
  }

  getStalledBatches() {
    const batches = getBatchFolders()
      .map((folder) => {
        return getBatch(folder);
      })
      .filter((batch) => {
        return batch.output.length < batch.input.length;
      });
    return batches;
  }

  processBatch(batchFolder: string) {
    const worker = new Worker(
      new URL('./blur.service.worker.ts', import.meta.url),
      { workerData: { batchFolder } }
    );
    this.events.next({ type: 'message', data: { batchFolder } });
    worker.on('message', (message) => {
      console.log('Message from worker => ', message);
      this.events.next({ type: 'message', data: {message, batchFolder} });
    });

    worker.on('exit', (code) => {
      console.log('Worker exited with codes => ', code);
      delete this.workers[batchFolder];
      this.events.next({ type: 'message', data: { code, batchFolder } });
    });
    worker.on('error', (error) => {
      console.log('Worker error => ', error);
      delete this.workers[batchFolder];
    });
    this.workers[batchFolder] = worker;
  }

  isWorking(batch: string) {
    return this.workers[batch];
  }
}
