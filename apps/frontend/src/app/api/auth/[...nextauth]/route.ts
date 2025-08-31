import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { getApiUrl } from "@/lib/utils";

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE CREDENTIALS ===");
        console.log("Credentials:", credentials);

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const apiUrl = getApiUrl();

          console.log("Backend API URL:", apiUrl);

          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log("Response status:", response.status);
          const data = await response.json();

          console.log("Response data:", data);

          if (response.ok && data.access_token) {
            console.log("Login successful");

            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              accessToken: data.access_token,
            };
          }

          console.log("Login failed - Response:", response.status, data);
          return null;
        } catch (error) {
          console.error("Error during login:", error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ account, profile, user }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Account provider:", account?.provider);
      console.log("User:", user);

      if (account?.provider === "google" && profile) {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              googleId: profile.sub,
            }),
          });

          if (!response.ok) {
            console.error("Backend response not ok:", response.status);
            return false;
          }

          const data = await response.json();

          if (data.access_token && data.user) {
            // Armazenar os dados do usuário no objeto user para usar nos outros callbacks
            if (user) {
              user.id = data.user.id;
              user.email = data.user.email;
              user.name = data.user.name;
              user.role = data.user.role;
              user.accessToken = data.access_token;
            }

            return true;
          }

          return false;
        } catch (error) {
          console.error("Google sign in error:", error);
          return false;
        }
      }

      console.log("SignIn returning true");
      return true;
    },
    async jwt({ token, user }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Token before:", token);
      console.log("User:", user);

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }

      console.log("Token after:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Session before:", session);
      console.log("Token:", token);

      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;

      console.log("Session after:", session);
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("BaseURL:", baseUrl);

      // Se a URL for relativa ao baseUrl, redireciona para work-hours
      if (url.startsWith(baseUrl)) {
        console.log("Redirecting to work-hours");

        return `${baseUrl}/work-hours`;
      }

      // Se for uma URL externa, mantém o redirecionamento original
      console.log("External URL, keeping original redirect");

      return url;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  events: {
    signIn: async () => {
      console.log("User signed in");
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
