import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import z from "zod";

interface AccessTokenPayload {
    id: number;
    email: string;
}

const accessTokenSchema = z.object({
    accessToken: z.string()
});

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {

        //validating the access token is present or not
        const result = accessTokenSchema.safeParse(req.headers.authorization);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { accessToken } = result.data;

        //extract token from header
        const [schema, token] = accessToken.split(" ");

        //verify
        if(schema != "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization header",
            });
        }

         //jwt secret
        const secret = process.env.JWT_SECRET;

        if(!secret) {
            throw new Error("JWT_SECRET is missing");
        }

        const decoded = jwt.verify(token, secret);

        if(
            typeof decoded !== "object" || 
            decoded == null ||
            typeof decoded.id !== "number" ||
            typeof decoded.email !== "string"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token",
            });
        }

        const payload = decoded as AccessTokenPayload;

        req.user = {
            id: payload.id,
            email: payload.email
        }

        next();
    
        
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token",
        });
    }
}

export default verifyUser;