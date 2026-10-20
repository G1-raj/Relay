import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import generateOtp from "../../../utils/generateOtp.js";
import bcrypt from "bcrypt";
import z from "zod";
import sendMail from "../../../utils/send_verification_mail.js";

const sendOtpSchema = z.object({
    email: z.email()
});

const sendOtp = async (req: Request, res: Response) => {
    try {

        //validating the request parameters
        const result = sendOtpSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed"
            });
        }

        const { email } = result.data;

        //check if user exist
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

        //generate otp
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);

        //save otp in database
        await prisma.otp.create({
            data: {
                userId: existingUser.id,
                otpHash: hashedOtp,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), //expire in 15 minutes
            }
        });

        //sending otp on email
        await sendMail(email, otp);

        return res.status(201).json({
            success: true,
            message: "Otp sent successfully"
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export default sendOtp;