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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const apiUrl = getApiUrl();
        const body = JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        });

        try {
          const userResponse = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (!userData.access_token) {
              return null;
            }
            return {
              id: userData.user.id,
              email: userData.user.email,
              name: userData.user.name,
              role: userData.user.role,
              actorType: "USER",
              accessToken: userData.access_token,
            };
          }
        } catch (error) {
          console.error("Error during User login:", error);
        }

        try {
          const userCheckResponse = await fetch(
            `${apiUrl}/users/check?email=${encodeURIComponent(credentials.email)}`
          );
          if (!userCheckResponse.ok) {
            return null;
          }

          const { exists } = await userCheckResponse.json();
          if (exists !== false) {
            return null;
          }
        } catch (error) {
          console.error("Error checking User email:", error);
          return null;
        }

        try {
          const adminResponse = await fetch(
            `${apiUrl}/company-admin/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            }
          );

          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (!adminData.access_token) {
              return null;
            }
            return {
              id: adminData.admin.id,
              email: adminData.admin.email,
              name: adminData.admin.email,
              actorType: "COMPANY_ADMIN",
              accessToken: adminData.access_token,
            };
          }
        } catch (error) {
          console.error("Error during CompanyAdmin login:", error);
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ account, profile, user }) {
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
              user.actorType = "USER";
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

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.actorType = user.actorType;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.actorType = token.actorType;
      }

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
