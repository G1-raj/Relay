import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


const userSchema = z.object({
    email: z.string().email(),
    password: z.string().length(8, "Password must be at least 8 characters")
});

const login = async (req: Request, res: Response) => {
    try {

        const result = userSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { email, password } = result.data;

        //check if user exist or not
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        //validate password
        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        //jwt secrets for access and refresh token
        const jwtSecret = process.env.JWT_SECRET;
        const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

        if(!jwtSecret || !refreshSecret) {
            throw Error("Jwt secrets are missing");
        }

        //pauyload for jwt
        const payload = {
            id: user.id,
            email: user.email
        }

        //access token
        const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m', algorithm: 'HS256'});
        //refresh token
        const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d', algorithm: 'HS256'});

        //hashing refresh token to save in database
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        //saving refresh token in database in hashed form
        await prisma.session.create({
            data: {
                refreshToken: refreshTokenHash,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        //sending and saving the refreshtoken in cookie
        req.cookies("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        const userCredentials = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            accessToken: accessToken,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        //success response
        return res.status(200).json({
            success: true,
            data: user,
            message: "User login successful"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export default login;