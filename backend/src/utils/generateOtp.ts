import crypto from "node:crypto";

const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
}

export default generateOtp;
