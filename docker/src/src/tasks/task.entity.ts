type TaskMetadata = {
  id: number;
  title: string;
  description?: string;
};

export type Task = TaskMetadata &
  (
    | {
        status: 'waiting';
      }
    | {
        status: 'running';
        started_at: Date;
      }
    | {
        status: 'errored';
        started_at: Date;
        finished_at: Date;
        error: string;
      }
    | {
        status: 'succeeded';
        started_at: Date;
        finished_at: Date;
      }
  );

export interface CreateTaskBody {
  title: string;
  description?: string;
}