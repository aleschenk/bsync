package main

import (
	"flag"
	"fmt"
	"net/http"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

var store storage.FileSystemStorage

func newAccount(c *gin.Context) {
	accountId := c.PostForm("id")

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

	var tabs []storage.Tab

	if err := store.SaveSession(accountId, sessionId, tabs); err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s/sessions/%s", accountId, sessionId))
	c.String(http.StatusCreated, "", accountId)
	// c.Copy().FileFromFS("")
}

func getSession(c *gin.Context) {
	accountId := c.Param("accountId")
	sessionId := c.Param("sessionId")

	session, err := store.GetSession(accountId, sessionId)
	if err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s/sessions/%s", accountId, sessionId))
	c.String(http.StatusCreated, "", accountId)
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

	// Creates a gin router with default middleware:
	// logger and recovery (crash-free) middleware
	router := gin.Default()

	router.POST("/accounts", newAccount)
	router.POST("/accounts/:accountId/sessions/:sessionId", saveSession)
	router.GET("/accounts/:accountId/sessions/:sessionId", getSession)

	router.Run(serverAddr)
}
