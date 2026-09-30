import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    role: "USER" | "ADMIN";
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
    accessToken?: string;
    refreshToken?: string;
  }
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DjangoTokenResponse {
  access: string;
  refresh: string;
}

interface DjangoUser {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);

        if (!parsed.success || !API_URL) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          // 1. Login through Django
          const tokenResponse = await fetch(`${API_URL}/auth/token/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });

          if (!tokenResponse.ok) {
            return null;
          }

          const tokens: DjangoTokenResponse = await tokenResponse.json();

          // 2. Get the authenticated Django user
          const userResponse = await fetch(`${API_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          });

          if (!userResponse.ok) {
            return null;
          }

          const user: DjangoUser = await userResponse.json();

          // 3. Return user information to NextAuth
          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          };
        } catch (error) {
          console.error("Django authentication error:", error);
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        // Google authentication needs to be handled by Django
        // before enabling this provider.
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role ?? "USER";
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role ?? "USER";
      }

      session.accessToken = token.accessToken;

      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
