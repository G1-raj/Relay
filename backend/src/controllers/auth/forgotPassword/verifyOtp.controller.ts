import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import bcrypt from "bcrypt";
import z from "zod";

const verifyOtpSchema = z.object({
    email: z.email(),
    otp: z.string()
});

const verifyOtp = async (req: Request, res: Response) => {
    try {

        //validating request body parameters
        const result = verifyOtpSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { email, otp } = result.data;

        //check existing user
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if(!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        //find latest otp
        const otpRecord = await prisma.otp.findFirst({
            where: {
                userId: existingUser.id,
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        //check if otp is valid
        const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);


        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        //mark otp as used
        const markUsed = await prisma.otp.updateMany({
            where: {
                id: otpRecord.id,
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            data: {
                used: true
            }
        });

        if (markUsed.count !== 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }


        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default verifyOtp;