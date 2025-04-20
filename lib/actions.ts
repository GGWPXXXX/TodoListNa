"use server";

import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { todos, users } from "@/lib/db/schema";
import { deleteFromS3, uploadToS3 } from "@/lib/s3";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function getTodos() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return [];
  }

  try {
    const data = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, session.user.id));
    return data;
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return [];
  }
}

export async function addTodo(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const content = formData.get("content") as string;
  const image = formData.get("image") as File | null;

  let imageUrl = undefined;

  const uploadImage = async () => {
    if (image && image.size > 0) {
      try {
        const filename = `${session.user.id}/${image.name}`;
        imageUrl = await uploadToS3(image, filename);
        return imageUrl;
      } catch (error) {
        console.error("Failed to upload image:", error);
        return null;
      }
    }
    return null;
  };

  const todoId = uuidv4();
  try {
    await db.insert(todos).values({
      id: todoId,
      content,
      completed: false,
      imageUrl: null,
      userId: session.user.id,
      createdAt: new Date(),
    });

    const uploadedImageUrl = await uploadImage();

    if (uploadedImageUrl) {
      await db
        .update(todos)
        .set({ imageUrl: uploadedImageUrl })
        .where(eq(todos.id, todoId));
    }

    revalidatePath("/");

    return {
      id: todoId,
      content,
      completed: false,
      imageUrl: uploadedImageUrl,
      userId: session.user.id,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Failed to add todo:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }

    throw error;
  }
}

export async function updateTodoStatus(
  id: string,
  status: "In Progress" | "Done"
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));

    if (!todo || todo.userId !== session.user.id) {
      throw new Error("Todo not found or unauthorized");
    }

    await db.update(todos).set({ status }).where(eq(todos.id, id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update todo:", error);
    throw new Error("Failed to update todo");
  }
}

export async function deleteTodo(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));

    if (!todo || todo.userId !== session.user.id) {
      throw new Error("Todo not found or unauthorized");
    }

    // Extract S3 key from imageUrl if it exists
    if (todo.imageUrl) {
      const key = new URL(todo.imageUrl).pathname.substring(1);
      // console.log("Deleting image from S3 with key:", key);
      await deleteFromS3(key);
    }

    await db.delete(todos).where(eq(todos.id, id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete todo:", error);
    throw new Error("Failed to delete todo");
  }
}

export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return { error: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to register user:", error);
    return { error: "Failed to register user" };
  }
}
