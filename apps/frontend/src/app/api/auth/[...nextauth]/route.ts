import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          if (data.access_token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              accessToken: data.access_token,
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
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
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: profile.email,
                name: profile.name,
                googleId: profile.sub,
              }),
            }
          );

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
      console.log("Account provider:", account?.provider);
      console.log("User:", user);
      console.log("Token before:", token);

      // Se for login do Google, usar os dados que vieram do backend
      if (user && account?.provider === "google") {
        console.log("Processing Google login");
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // Se for login com credentials, usar os dados normalmente
      else if (user && account?.provider === "credentials") {
        console.log("Processing credentials login");
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // Se for uma chamada subsequente (sem user), manter o token
      else if (!user) {
        console.log("Subsequent JWT call, keeping existing token");
      }

      console.log("Token after:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Token:", token);
      console.log("Session before:", session);

      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.accessToken = token.accessToken as string;
      }

      console.log("Session after:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
