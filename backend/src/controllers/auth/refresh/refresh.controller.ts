import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import z from "zod";

interface RefreshTokenPayload {
    id: string,
    email: string
}

const refreshTokenSchema = z.object({
    refreshToken: z.string()
});

const refreshAccessToken = async (req: Request, res: Response) => {
    try {

        //getting refresh token from the cookie
        const result = refreshTokenSchema.safeParse(req.cookies.refreshToken);

        //validating if refresh token exist or not
        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { refreshToken } = result.data;

         //jwt secrets
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
        const jwtSecret = process.env.JWT_SECRET;

        if(!refreshTokenSecret || !jwtSecret) {
             throw new Error("JWT secrets are missing");
        }

        //extracting payload from refresht token
        const decoded = jwt.verify(refreshToken, refreshTokenSecret, { algorithms: ["HS256"] });

        if (
            typeof decoded === "string" ||
            typeof decoded.id !== "number" ||
            typeof decoded.email !== "string"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const payload = decoded as RefreshTokenPayload;

        //getting all the sessions
        const sessions = await prisma.session.findMany({
            where: {
                userId: Number(payload.id),
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if(sessions.length == 0) {
            return res.status(401).json({
                success: false,
                message: "Refresh token expired or revoked",
            });
        }

        //getting valid session
        let isValidSession = null;

        for(const session of sessions) {
            const isValid = await bcrypt.compare(refreshToken, session.refreshToken);

            if(isValid) {
                isValidSession = isValid;
                break;
            }
        }

        //creating new access token if session is valid
        const newAccessToken = jwt.sign(
            {
                email: payload.email,
                id: payload.id
            },
            jwtSecret,
            {
                expiresIn: '15m',
                algorithm: 'HS256'
            }
        );

        //success response with new access token
        return res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
            },
            message: "Access token refreshed successfully",
        });

        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default refreshAccessToken;