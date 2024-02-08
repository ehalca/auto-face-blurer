import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppService } from './app.service';
import { Multer } from 'multer';
import { interval, map, Observable } from 'rxjs';
import { BlurWorkerManager } from './blur-worker-manager.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly workerService: BlurWorkerManager
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('batches')
  getBatches() {
    return this.appService.getBatches();
  }

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files'))
  postBatch(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log(files.length);
    return this.appService.postBatch(files);
  }

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.workerService.events;
  }

  
}
