import { authOptions } from "@/lib/config/auth";
import { User } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      type: string;
      id: string;
      user: User;
    } & DefaultSession["user"] &
    User;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
