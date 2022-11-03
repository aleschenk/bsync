package main

import (
	"flag"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func newAccount(c *gin.Context) {
	accountId := c.PostForm("id")

	if err := CreateNewAccount(accountId); err != nil {
		c.String(http.StatusInternalServerError, "The account could not be created")
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s", accountId))
	c.String(http.StatusCreated, "", accountId)
}

func saveSession(c *gin.Context) {
	accountId := c.Param("accountId")
	sessionId := c.Param("sessionId")

	if err := SaveSession(accountId, sessionId, ""); err != nil {
		c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
		return
	}

	c.Header("Location", fmt.Sprintf("/accounts/%s/sessions/%s", accountId, sessionId))
	c.String(http.StatusCreated, "", accountId)
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

	router.Run(serverAddr)
}
