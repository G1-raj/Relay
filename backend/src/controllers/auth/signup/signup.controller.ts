import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import z from "zod";
import bcrypt from "bcrypt";

const userSchema = z.object({
    fullName: z.string(),
    email: z.email(),
    password: z.string().length(8, "Password must be at least 8 characters")
});

const signUp = async (req: Request, res: Response) => {
    try {

        const result = userSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { fullName, email, password } = result.data;

        //checking if user already exist
        const userExist = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(userExist) {
            return res.status(409).json({
                success: false,
                message: "User already exist"
            });
        }

        //hashing password 
        const hashedPassword = await bcrypt.hash(password, 10);

        //creating user
        const user = await prisma.user.create({
            data: {
                fullName: fullName,
                email: email,
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

        return res.status(201).json({
            success: true,
            data: user,
            message: "User created successfully"
        });

        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export default signUp;