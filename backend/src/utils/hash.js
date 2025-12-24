import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Hash a plain password
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare plain password with hashed password
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}