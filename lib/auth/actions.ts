"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

export type ActionState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
};

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),

  email: z.string().email("Please enter a valid email address."),

  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function registerAction(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const validatedFields = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Please correct the errors below.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message:
          data?.email?.[0] ||
          data?.password?.[0] ||
          data?.detail ||
          data?.message ||
          "Registration failed.",
      };
    }
  } catch (error) {
    console.error("Registration error:", error);

    return {
      success: false,
      message: "Unable to connect to the server. Please try again.",
    };
  }

  redirect("/login?registered=true");
}
