import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import z from "zod";

const logOutSchema = z.object({
    refreshToken: z.string()
});

const logout = async (req: Request, res: Response) => {
    try {

        const result = logOutSchema.safeParse(req.cookies.refreshToken);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { refreshToken } = result.data;

        res.cookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        if (!refreshToken || typeof refreshToken !== "string") {
            return res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }

        // Find the user's sessions
        const sessions = await prisma.session.findMany({
            select: {
                id: true,
                refreshToken: true,
            },
        });

        // Find the session matching this refresh token
        let sessionId: number | null = null;

        for (const session of sessions) {
            if (await import("bcrypt").then(({ default: bcrypt }) =>
                bcrypt.compare(refreshToken, session.refreshToken)
            )) {
                sessionId = session.id;
                break;
            }
        }


        // Revoke only the matching session
        if (sessionId !== null) {
            await prisma.session.delete({
                where: { id: sessionId },
            });
        }

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default logout;