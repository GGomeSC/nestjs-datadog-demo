import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerOptions } from './logger/logger.service';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [WinstonModule.forRoot(loggerOptions), TasksModule],
})
export class AppModule {}
