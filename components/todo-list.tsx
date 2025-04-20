"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addTodo, deleteTodo, updateTodoStatus } from "@/lib/actions";
import type { Todo } from "@/lib/types";
import { Loader2, Plus, Trash, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import "react-image-lightbox/style.css";

interface TodoListProps {
  initialTodos: Todo[];
}

export default function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", newTodo);
      if (file) {
        formData.append("image", file);
      }

      const todo = await addTodo(formData);
      const newTodoWithStatus: Todo = {
        ...todo,
        status: "In Progress",
        imageUrl: todo.imageUrl ?? null,
      };
      setTodos([...todos, newTodoWithStatus]);

      setNewTodo("");
      setFile(null);
    } catch (error) {
      console.error("Failed to add todo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const updatedTodos = todos.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed;
          const newStatus: "In Progress" | "Done" = newCompleted
            ? "Done"
            : "In Progress";
          return {
            ...todo,
            completed: newCompleted,
            status: newStatus,
          };
        }
        return todo;
      });

      setTodos(updatedTodos);

      const updatedTodo = updatedTodos.find((todo) => todo.id === id);
      if (updatedTodo) {
        await updateTodoStatus(id, updatedTodo.status);
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "In Progress" | "Done"
  ) => {
    try {
      await updateTodoStatus(id, status);
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, status } : todo))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Todo Section */}
      <form
        onSubmit={handleAddTodo}
        className="space-y-4 bg-white shadow-lg p-6 rounded-lg"
      >
        <h2 className="text-2xl font-semibold text-center">Add a New Todo</h2>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            disabled={isLoading}
            className="bg-gray-100 focus:bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition"
          />
          <div className="flex items-center gap-2">
            <Input
              type="file"
              id="todo-image"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("todo-image")?.click()}
              disabled={isLoading}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              {file ? file.name : "Attach Image (Optional)"}
            </Button>
            <Button
              type="submit"
              disabled={!newTodo.trim() || isLoading}
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Todo
            </Button>
          </div>
          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="mt-2 rounded-md max-h-40 object-cover border"
            />
          )}
        </div>
      </form>

      {/* Todo List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center text-gray-500">
            No todos yet. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <Card
              key={todo.id}
              className="overflow-hidden border rounded-xl shadow-lg hover:shadow-xl transition duration-300"
            >
              <CardContent className="p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.status === "Done"}
                  onCheckedChange={() => handleToggleTodo(todo.id)}
                  className="mt-1"
                />

                <div className="space-y-2">
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={`block font-medium ${
                      todo.status === "Done" ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {todo.content}
                  </label>

                  {todo.imageUrl && (
                    <img
                      src={todo.imageUrl || "/placeholder.svg"}
                      alt="Todo attachment"
                      className="rounded-md max-h-40 object-cover border cursor-zoom-in transition hover:brightness-90"
                      onClick={() => {
                        setSelectedImage(todo.imageUrl);
                      }}
                    />
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span
                      className={`text-xs font-semibold rounded-full px-2 py-1 ${
                        todo.status === "Done"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {todo.status}
                    </span>

                    {["In Progress", "Done"].map((status) =>
                      todo.status !== status ? (
                        <Button
                          key={status}
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleStatusChange(
                              todo.id,
                              status as "In Progress" | "Done"
                            )
                          }
                        >
                          Mark as {status}
                        </Button>
                      ) : null
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedImage && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex justify-center items-center">
          <div className="relative max-w-[90%] max-h-[90%] overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-0 right-0 text-white text-2xl p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
            >
              X
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
