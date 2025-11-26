import { verifyToken } from "../helpers/jwt.js";
import User from "../models/User.js";

export const auth = async (req, res) => {
  const token = req.headers.authorization;
  if (!token) throw new Error("Unauthorized");

  const accessToken = token.split(" ")[1];
  if (!accessToken) throw new Error("Unauthorized");

  const payload = verifyToken(accessToken);

  const user = await User.getUserById(payload._id);
  if (!user) throw new Error("Unauthorized");

  return user;
};
