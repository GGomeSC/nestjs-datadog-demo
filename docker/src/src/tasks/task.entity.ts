export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending';
  createdAt: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
}
