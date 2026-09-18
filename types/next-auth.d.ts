import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      officeId?: string | null;
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    officeId?: string | null;
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    officeId?: string | null;
    phone?: string | null;
  }
}
