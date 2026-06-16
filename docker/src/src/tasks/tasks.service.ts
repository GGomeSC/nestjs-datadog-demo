import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type { CreateTaskBody, Task } from './task.entity';

@Injectable()
export class TasksService {
  private readonly tasks: Task[] = [
    {
      id: uuid(),
      title: 'Prepare demo environment',
      description: 'Confirm Docker and Datadog credentials are ready.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: 'Run task API locally',
      description: 'Start the NestJS API and Datadog Agent with Docker Compose.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: 'Show traces in Datadog APM',
      description: 'Exercise endpoints and inspect spans, errors, and logs.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  async findAll(slow?: boolean): Promise<Task[]> {
    if (slow) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return this.tasks;
  }

  create(body: CreateTaskBody): Task {
    const task: Task = {
      id: uuid(),
      title: body.title,
      description: body.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    return task;
  }

  findOne(id: string): Task {
    const task = this.tasks.find((item) => item.id === id);

    if (!task) {
      throw new NotFoundException({ error: 'Task not found', id });
    }

    return task;
  }

  remove(id: string, fail?: boolean): void {
    if (fail) {
      throw new InternalServerErrorException('Simulated task deletion failure');
    }

    const index = this.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      throw new NotFoundException({ error: 'Task not found', id });
    }

    this.tasks.splice(index, 1);
  }
}
