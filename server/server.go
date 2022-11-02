package main

import (
	"flag"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func newAccount(c *gin.Context) {
	accountId, err := CreateNewAccount()
	if err != nil {
		c.String(http.StatusInternalServerError, "The account could not be created")
		return
	}

	c.String(http.StatusAccepted, "Hello %s", accountId)
}

func saveTabs(c *gin.Context) {
	accountId := c.Param("accountId")
	fmt.Printf("Account Id: %s", accountId)
	c.String(http.StatusAccepted, "Hello %s", accountId)
}

func main() {
	var serverAddr string
	flag.StringVar(&serverAddr, "serverAddr", ":2544", "The port number")
	flag.Parse()

	// Creates a gin router with default middleware:
	// logger and recovery (crash-free) middleware
	router := gin.Default()

	router.POST("/accounts", newAccount)
	router.POST("/accounts/:accountId/tabs", saveTabs)

	router.Run(serverAddr)
}
