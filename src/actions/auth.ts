"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(72),
  dealership: z.string().trim().min(2).max(80),
  rooftop: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(2),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signupAction(_prev: { error?: string } | null, formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    dealership: formData.get("dealership"),
    rooftop: formData.get("rooftop"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.success) {
    return { error: "Check the form. Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  let slug = slugify(parsed.data.dealership) || "dealership";
  const clash = await prisma.organization.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  await prisma.organization.create({
    data: {
      name: parsed.data.dealership,
      slug,
      demoMode: true,
      rooftops: {
        create: {
          name: parsed.data.rooftop,
          city: parsed.data.city,
          state: parsed.data.state.toUpperCase(),
        },
      },
      users: {
        create: {
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: { rooftops: true, users: true },
  });
  if (org?.users[0] && org.rooftops[0]) {
    await prisma.user.update({
      where: { id: org.users[0].id },
      data: { rooftopId: org.rooftops[0].id },
    });
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Sign in from the login page." };
    }
    throw error;
  }
  return null;
}
