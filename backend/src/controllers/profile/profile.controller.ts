import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

const getMe = async (req: Request, res: Response) => {
    try {

        const userId = req.user?.id;

        //authentication failed
        if(!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        //find user details 
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: {
                    select: {
                        imageUrl: true,
                        imageId: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        //return if user does not exist
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
            message: "Profile fetched successfully",
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error;"
        });
    }
}

export default getMe;