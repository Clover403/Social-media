import bcrypt from "bcryptjs"

export function hashPassword(password){
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

export function comparePassword(password, hashPassword){
  return bcrypt.compareSync(password, hashPassword)
}
