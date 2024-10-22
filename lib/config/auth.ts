import { loginUser } from "@/app/_actions/_actions";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SigninMessage } from "../SigninMessage";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: "signMessage",
            name: "Solana",
            credentials: {
                message: {
                    label: "Message",
                    type: "text",
                },
                signature: {
                    label: "Signature",
                    type: "text",
                },
            },
            async authorize(credentials, req) {
                try {
                    const signinMessage = new SigninMessage(
                        JSON.parse(credentials?.message || "{}"),
                    );

                    const csrfToken = await getCsrfToken({ req: { ...req, body: null } });
                    if (signinMessage.nonce !== csrfToken) {
                        return null;
                    }

                    const validationResult = await signinMessage.validate(
                        credentials?.signature || "",
                    );

                    if (!validationResult)
                        throw new Error("Could not validate the signed message");

                    // Check if user exists
                    const user = await prisma.user.findFirst({
                        where: {
                            publicKey: signinMessage.publicKey,
                        },
                    });
                    // Create new user if doesn't exist
                    if (!user) {
                        loginUser(signinMessage.publicKey);
                    }

                    return {
                        id: signinMessage.publicKey,
                    };
                } catch (e) {
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({ session, token }) {
            // @ts-expect-error: token.sub is not a standard property
            session.publicKey = token.sub;
            if (session.user) {
                session.user.name = token.sub;
            }
            return session;
        },
    },
};