import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import bcrypt from "bcrypt";
import z from "zod";

const changePasswordSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at lease 8 characters")
});

const changePassword = async (req: Request, res: Response) => {
    try {

        const result = changePasswordSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { email, password } = result.data;

        //find existing user
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

         //notify user that user does not exist
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //save password 
        const updatedUser = await prisma.user.update({
            where: {
                email: email
            },
            data: {
                password: hashedPassword
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
                updatedAt: true
            }
        });

        //revoking access from all active sessions
        await prisma.session.deleteMany({
            where: {
                userId: updatedUser.id
            }
        });

        //clearng refresh token from cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Password changed successfully"
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default changePassword;