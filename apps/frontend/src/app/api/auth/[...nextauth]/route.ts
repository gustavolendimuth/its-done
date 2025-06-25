import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiUrl } from "@/lib/utils";
import { normalizeUrl } from "@/lib/utils";

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
          const normalizedBackendUrl = normalizeUrl(
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
          );

          console.log("Backend URL:", normalizedBackendUrl);

          const response = await fetch(`${normalizedBackendUrl}/auth/login`, {
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
    async jwt({ token, user, account }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Token before:", token);
      console.log("User:", user);
      console.log("Account:", account);

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        // Se tiver accessToken no user (login com credentials ou google), usar ele
        if (user.accessToken) {
          token.accessToken = user.accessToken;
        }
      }

      // Se for Google OAuth, o access token vem do account
      if (account?.provider === "google" && account.access_token) {
        // Mas nós não queremos usar o token do Google, queremos usar o token do nosso backend
        // que foi armazenado em user.accessToken durante o signIn callback
        console.log(
          "Google OAuth detected, but using backend token from user object"
        );
      }

      console.log("Token after:", token);

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      session.accessToken = token.accessToken as string;

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
