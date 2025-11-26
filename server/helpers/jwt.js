import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "rahasia";

export function signToken(payload) {
    return jwt.sign(payload, SECRET);
}

export function verifyToken(token) {
    return jwt.verify(token, SECRET);
}