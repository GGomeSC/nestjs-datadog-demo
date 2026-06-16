import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { CreateTaskBody, Task } from './task.entity';

@Injectable()
export class TasksService {
  private nextId = 4;

  private readonly tasks: Task[] = [
    {
      id: 1,
      title: 'Prepare demo environment',
      description: 'Confirm Docker and Datadog credentials are ready.',
      status: 'waiting',
    },
    {
      id: 2,
      title: 'Run task API locally',
      description: 'Start the NestJS API and Datadog Agent with Docker Compose.',
      status: 'running',
      started_at: new Date(),
    },
    {
      id: 3,
      title: 'Show traces in Datadog APM',
      description: 'Exercise endpoints and inspect spans, errors, and logs.',
      status: 'succeeded',
      started_at: new Date(),
      finished_at: new Date(),
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
      id: this.nextId,
      title: body.title,
      description: body.description,
      status: 'waiting',
    };

    this.nextId += 1;
    this.tasks.push(task);
    return task;
  }

  findOne(id: string): Task {
    const task = this.tasks.find((item) => item.id === Number(id));

    if (!task) {
      throw new NotFoundException({ error: 'Task not found', id });
    }

    return task;
  }

  remove(id: string, fail?: boolean): void {
    if (fail) {
      throw new InternalServerErrorException('Simulated task deletion failure');
    }

    const index = this.tasks.findIndex((task) => task.id === Number(id));

    if (index === -1) {
      throw new NotFoundException({ error: 'Task not found', id });
    }

    this.tasks.splice(index, 1);
  }
}