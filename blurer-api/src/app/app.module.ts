import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService, UPLOAD_FOLDER } from './app.service';
import { BlurWorkerManager } from './blur-worker-manager.service';
import { CleanerService } from './cleaner.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_FOLDER,
      serveRoot: '/api/uploads',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, CleanerService, BlurWorkerManager],
})
export class AppModule {}
