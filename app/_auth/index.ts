import { authOptions } from "@/lib/config/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getSession() {
  return await getServerSession(authOptions);
}
export async function useAuthUser() {
  try {
    const session = await getSession();
    console.log(session);
    if (!session?.user?.publicKey) {
      return null;
    }
    const authUser = await prisma.user.findUnique({
      where: { publicKey: session.user.name! },
    });
    if (!authUser) {
      return null;
    }
    return authUser;
  } catch (error: any) {
    return null;
  }
}
