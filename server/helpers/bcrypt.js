import bcrypt from "bcryptjs";

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password, hashPasswordValue) {
  return bcrypt.compareSync(password, hashPasswordValue);
}
