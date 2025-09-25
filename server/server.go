package main

import (
	"flag"
	"fmt"
	"net/http"
	"time"

	docs "bsync.com/m/v2/docs" // Import docs package
	"bsync.com/m/v2/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

var store storage.FileSystemStorage

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string `json:"status" example:"healthy"`
	Timestamp string `json:"timestamp" example:"2024-01-20T19:30:45Z"`
	Service   string `json:"service" example:"bsync-server"`
	Version   string `json:"version" example:"1.0.0"`
}

// @Summary Create new account
// @Description Create a new account with the given ID
// @Tags accounts
// @Accept application/x-www-form-urlencoded
// @Produce plain
// @Param id formData string true "Account ID"
// @Success 201 {string} string "Account created successfully"
// @Failure 400 {string} string "Missing id parameter"
// @Failure 500 {string} string "Account could not be created"
// @Router /accounts [post]
func newAccount(c *gin.Context) {
	accountId := c.PostForm("id")

	if accountId == "" {
		c.String(http.StatusBadRequest, "Missing id paramter")
		return
	}

	if err := store.CreateNewAccount(accountId); err != nil {
		c.String(http.StatusInternalServerError, "The account could not be created")
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s", accountId))
	c.String(http.StatusCreated, "", accountId)
}

// @Summary Save session
// @Description Save or update a session for a specific account
// @Tags sessions
// @Accept json
// @Produce plain
// @Param accountId path string true "Account ID"
// @Param sessionId path string true "Session ID"
// @Param session body []storage.Tab true "Session data"
// @Success 201 {string} string "Session saved successfully"
// @Failure 400 {string} string "Invalid JSON data"
// @Failure 500 {string} string "Session could not be saved"
// @Router /accounts/{accountId}/sessions/{sessionId} [post]
func saveSession(c *gin.Context) {
	accountId := c.Param("accountId")
	sessionId := c.Param("sessionId")

	var json []storage.Tab

	if err := c.ShouldBindJSON(&json); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := store.SaveSession(accountId, sessionId, json); err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s/sessions/%s", accountId, sessionId))
	c.String(http.StatusCreated, "", accountId)
}

// @Summary Get all sessions
// @Description Get all sessions for a specific account
// @Tags sessions
// @Accept json
// @Produce json
// @Param accountId path string true "Account ID"
// @Success 200 {array} string "List of session names"
// @Failure 500 {string} string "Error fetching sessions"
// @Router /accounts/{accountId}/sessions [get]
func getAllSession(c *gin.Context) {
	accountId := c.Param("accountId")

	sessionsName, err := store.GetAllSessions(accountId)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error fetching account with id: %s", accountId)
		return
	}

	c.JSON(http.StatusOK, sessionsName)
}

// @Summary Get specific session
// @Description Get a specific session for an account
// @Tags sessions
// @Accept json
// @Produce json
// @Param accountId path string true "Account ID"
// @Param sessionId path string true "Session ID"
// @Success 200 {array} storage.Tab "Session tabs"
// @Failure 500 {string} string "Error fetching session"
// @Router /accounts/{accountId}/sessions/{sessionId} [get]
func getSession(c *gin.Context) {
	accountId := c.Param("accountId")
	sessionId := c.Param("sessionId")

	session, err := store.GetSession(accountId, sessionId)
	if err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.JSON(http.StatusOK, session.Tabs)
}

// @Summary Health check
// @Description Get server health status
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "bsync-server",
		"version":   "1.0.0",
	})
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
func StartServer() {
	var serverAddr, databasePath string

	flag.StringVar(&serverAddr, "serverAddr", ":2544", "The port number")
	flag.StringVar(&databasePath, "databasePath", ".db", `
		The path where the database file will be store. You could use :memory: to instead create a temporal database
	`)
	flag.Parse()

	storage.InitDatabase(databasePath)
	defer storage.CloseDatabase()

	// Configure Swagger docs
	docs.SwaggerInfo.BasePath = "/"

	router := gin.Default()

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

	// Health check endpoint
	router.GET("/health", healthCheck)

	// API endpoints
	router.POST("/accounts", newAccount)
	router.POST("/accounts/:accountId/sessions/:sessionId", saveSession)
	router.GET("/accounts/:accountId/sessions", getAllSession)
	router.GET("/accounts/:accountId/sessions/:sessionId", getSession)

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	router.Run(serverAddr)
}
