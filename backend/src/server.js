// src/server.js

import dotenv from 'dotenv'
import app from './app.js'
import pool from './config/db.js'

dotenv.config()

const PORT = process.env.PORT || 4000

async function startServer() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connected at:', result.rows[0].now)

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

startServer()