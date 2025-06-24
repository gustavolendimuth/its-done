declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    accessToken?: string;
  }
}
