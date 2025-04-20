import { authOptions } from "@/auth";
import TodoList from "@/components/todo-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getTodos } from "@/lib/actions";
import { Todo } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    let todos: Todo[] = [];
    let error = null;

    try {
      todos = (await getTodos()).map((todo) => ({
        ...todo,
        imageUrl: todo.imageUrl === null ? null : todo.imageUrl,
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to fetch todos";
      console.error("Error fetching todos:", e);
    }

    return (
      <main className="container max-w-3xl mx-auto py-10 px-4">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Todo App</h1>
              <p className="text-muted-foreground">
                Welcome back, {session.user?.name || session.user?.email}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline">Sign Out</Button>
            </form>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {!process.env.DATABASE_URL && (
                  <div className="mt-2">
                    Please make sure your DATABASE_URL environment variable is
                    set correctly.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <TodoList initialTodos={todos} />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Auth error:", error);
    redirect("/login");
  }
}
