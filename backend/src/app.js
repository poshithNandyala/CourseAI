import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import session from "express-session"
import passport from "./config/passport.js"

const app = express()

// Enhanced CORS configuration for development
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}))

// Handle preflight requests
app.options('*', cors())
app.use(express.json({ limit: "16mb" }))
app.use(express.urlencoded({ extended: true, limit: "16mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}))

// Initialize passport
app.use(passport.initialize())
app.use(passport.session())

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' })
})

//routes import
import userRoutes from "./routes/user.route.js"
import courseRoutes from "./routes/course.route.js"
import authRoutes from "./routes/auth.route.js"
import verificationRoutes from "./routes/verification.route.js"
import apiKeysRoutes from "./routes/api_keys.route.js"

//routes declaration
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/courses", courseRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/verification", verificationRoutes)
app.use("/api/v1/api-keys", apiKeysRoutes)

// Root API endpoint
app.get('/api/v1', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to CourseAI API',
        endpoints: {
            users: '/api/v1/users',
            courses: '/api/v1/courses',
            health: '/health'
        }
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    })
})

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

export { app }