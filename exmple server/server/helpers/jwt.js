import jwt from "jsonwebtoken"

export function signToken(payload){
  return jwt.sign(payload, "rahasia")
}

export function verifyToken(token){
  return jwt.verify(token, "rahasia")
}

