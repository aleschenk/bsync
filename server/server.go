package main

import (
	"flag"
	"fmt"
	"net/http"
	"time"

	"bsync.com/m/v2/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var store storage.FileSystemStorage

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

func getAllSession(c *gin.Context) {
	accountId := c.Param("accountId")
	sessionId := c.Param("sessionId")

	sessionsName, err := store.GetAllSessions(accountId, sessionId)
	if err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.JSON(http.StatusOK, sessionsName)
}

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

func main() {
	var serverAddr, databasePath string

	flag.StringVar(&serverAddr, "serverAddr", ":2544", "The port number")
	flag.StringVar(&databasePath, "databasePath", ".db", `
		The path where the database file will be store. You could use :memory: to instead create a temporal database
	`)
	flag.Parse()

	InitDatabase(databasePath)
	defer CloseDatabase()

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

	router.POST("/accounts", newAccount)
	router.POST("/accounts/:accountId/sessions/:sessionId", saveSession)
	router.GET("/accounts/:accountId/sessions", getAllSession)
	router.GET("/accounts/:accountId/sessions/:sessionId", getSession)

	router.Run(serverAddr)
}
