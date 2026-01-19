package main

import (
	"flag"
	"net/http"
	"time"

	"bsync.com/m/v2/api/accounts"
	"bsync.com/m/v2/api/auth"
	"bsync.com/m/v2/api/sessions"
	docs "bsync.com/m/v2/docs" // Import docs package
	"bsync.com/m/v2/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var store storage.FileSystemStorage

// var authMiddleware = auth.JWTMiddleware()
var authMiddleware = auth.BasicMiddleware(&store)
var logger *zap.Logger

// setupLogger configura el logger de Zap
func setupLogger() {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.LevelKey = "level"
	config.EncoderConfig.MessageKey = "message"
	config.EncoderConfig.CallerKey = "caller"

	var err error
	logger, err = config.Build()
	if err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}

	logger.Info("Logger initialized successfully")
}

// ginLoggerMiddleware es un middleware de logging para Gin usando Zap
func ginLoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logger.Info("HTTP Request",
			zap.String("method", param.Method),
			zap.String("path", param.Path),
			zap.Int("status", param.StatusCode),
			zap.Duration("latency", param.Latency),
			zap.String("client_ip", param.ClientIP),
			zap.String("user_agent", param.Request.UserAgent()),
		)
		return ""
	})
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string `json:"status" example:"healthy"`
	Timestamp string `json:"timestamp" example:"2024-01-20T19:30:45Z"`
	Service   string `json:"service" example:"bsync-server"`
	Version   string `json:"version" example:"1.0.0"`
}

// @Summary Health check
// @Description Get server health status
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func healthCheck(c *gin.Context) {
	logger.Debug("Health check requested")

	response := gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "bsync-server",
		"version":   "1.0.0",
	}

	logger.Debug("Health check completed", zap.String("status", "healthy"))
	c.JSON(http.StatusOK, response)
}

// @title BSync Server API
// @version 1.0.0
// @description API for BSync tab synchronization server
// @termsOfService http://swagger.io/terms/
// @contact.name BSync Team
// @contact.url https://github.com/bsync
// @contact.email support@bsync.com
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
// @host localhost:2544
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Escriba "Bearer" seguido de un espacio y el token JWT. Ejemplo: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
func StartServer() {
	var serverAddr, databasePath string

	flag.StringVar(&serverAddr, "serverAddr", ":2544", "The port number")
	flag.StringVar(&databasePath, "databasePath", ".db", `
		The path where the database file will be store. You could use :memory: to instead create a temporal database
	`)
	flag.Parse()

	// Initialize logger
	setupLogger()
	defer logger.Sync()

	storage.InitDatabase(databasePath)
	defer storage.CloseDatabase()

	// Configure Swagger docs
	docs.SwaggerInfo.BasePath = "/"

	// Set Gin to release mode to reduce logging
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	// Add middleware
	router.Use(gin.Recovery())
	router.Use(ginLoggerMiddleware())

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"PUT", "PATCH", "GET", "POST"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		// AllowOriginFunc: func(origin string) bool {
		// 	return origin == "https://github.com"
		// },
		MaxAge: 1 * time.Hour,
	}))

	// Health check endpoint (público)
	router.GET("/health", healthCheck)

	// Endpoints de autenticación (públicos)
	router.POST("/accounts", accounts.CreateNewAccountHandler(&store))

	// This API should not be public
	//router.GET("/accounts", accounts.GetAllAccounts(&store))

	// Endpoints de tokens
	//router.POST("/auth/token", auth.GenerateTokenHandler(&store))
	//router.POST("/auth/refresh", authMiddleware, auth.RefreshTokenHandler())

	router.POST("/sessions", authMiddleware, sessions.SaveSession(&store))
	router.GET("/sessions", authMiddleware, sessions.GetAllSessions(&store))
	router.GET("/sessions/:sessionId", authMiddleware, sessions.GetSession(&store))

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	logger.Info("BSync server starting",
		zap.String("address", serverAddr),
		zap.String("database_path", databasePath),
	)

	logger.Info("Server routes configured successfully")
	router.Run(serverAddr)
}
