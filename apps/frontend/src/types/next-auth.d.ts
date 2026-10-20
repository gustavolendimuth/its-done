import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role?: "USER" | "ADMIN";
      actorType: "USER" | "COMPANY_ADMIN";
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: "USER" | "ADMIN";
    actorType: "USER" | "COMPANY_ADMIN";
    image?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role?: "USER" | "ADMIN";
    actorType: "USER" | "COMPANY_ADMIN";
    accessToken?: string;
  }
}
