import pool from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";



// User signup controller
export async function signup(req, res) {
  try {
    console.log("signup body:", req.body);
    const { name, email, password } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    // 2. Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];

    // 5. Generate JWT
    const token = generateToken({ userId: user.id });

    // 6. Send response
    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}


// User login controller
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // 2. Find user by email
    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // 3. Compare password
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // 4. Generate JWT
    const token = generateToken({ userId: user.id });

    // 5. Send response (exclude password)
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

//getme controller

export async function getMe(req, res) {
  try {
    // userId comes from authMiddleware
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get me error:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}