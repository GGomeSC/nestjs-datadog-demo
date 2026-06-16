import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { CreateTaskBody } from './task.entity';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('tasks')
  findAll(@Query('slow') slow?: string) {
    return this.tasksService.findAll(slow === 'true');
  }

  @Post('tasks')
  create(@Body() body: CreateTaskBody) {
    return this.tasksService.create(body);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Query('fail') fail?: string) {
    this.tasksService.remove(id, fail === 'true');
  }
}
