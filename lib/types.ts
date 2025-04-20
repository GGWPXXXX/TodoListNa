export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  imageUrl: string | null;
  createdAt: Date;
  userId: string;
  status: "In Progress" | "Done";
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}
