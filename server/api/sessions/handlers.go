package sessions

import (
	"fmt"
	"net/http"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// SaveSession creates or updates a session for an account.
// @Summary Save session
// @Description Save or update a session for a specific account
// @Tags sessions
// @Accept json
// @Produce plain
// @Security BearerAuth
// @Param accountId path string true "Account ID"
// @Param sessionId path string true "Session ID"
// @Param session body []storage.Tab true "Session data"
// @Success 201 {string} string "Session saved successfully"
// @Failure 400 {string} string "Invalid JSON data"
// @Failure 401 {string} string "Authorization token required"
// @Failure 403 {string} string "You do not have access to this account"
// @Failure 500 {string} string "Session could not be saved"
// @Router /accounts/{accountId}/sessions/{sessionId} [post]
func SaveSession(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		accountId, _ := c.Get("accountId")
		sessionId := c.Param("sessionId")

		var json []storage.Tab

		if err := c.ShouldBindJSON(&json); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := store.SaveSession(accountId.(string), sessionId, json); err != nil {
			c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
			return
		}

		c.Header("Location", fmt.Sprintf("/accounts/%s/sessions/%s", accountId, sessionId))
		c.String(http.StatusCreated, "", accountId)
	}
}

// GetAllSessions returns all session names for an account.
// @Summary Get all sessions
// @Description Get all sessions for a specific account
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param accountId path string true "Account ID"
// @Success 200 {array} string "List of session names"
// @Failure 401 {string} string "Authorization token required"
// @Failure 403 {string} string "You do not have access to this account"
// @Failure 500 {string} string "Error fetching sessions"
// @Router /accounts/{accountId}/sessions [get]
func GetAllSessions(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		//accountId := c.Param("account_id")
		accountId, _ := c.Get("accountId")

		sessionsName, err := store.GetAllSessions(accountId.(string))
		if err != nil {
			c.String(http.StatusInternalServerError, "Error fetching account with id: %s", accountId)
			return
		}

		c.JSON(http.StatusOK, sessionsName)
	}
}

// GetSession returns the tabs for a specific session.
// @Summary Get specific session
// @Description Get a specific session for an account
// @Tags sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param accountId path string true "Account ID"
// @Param sessionId path string true "Session ID"
// @Success 200 {array} storage.Tab "Session tabs"
// @Failure 401 {string} string "Authorization token required"
// @Failure 403 {string} string "You do not have access to this account"
// @Failure 500 {string} string "Error fetching session"
// @Router /accounts/{accountId}/sessions/{sessionId} [get]
func GetSession(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		accountId, _ := c.Get("accountId")
		sessionId := c.Param("sessionId")

		session, err := store.GetSession(accountId.(string), sessionId)
		if err != nil {
			c.String(http.StatusInternalServerError, "The sessions %s for the account %s could not be created or updated", sessionId, accountId)
			return
		}

		c.JSON(http.StatusOK, session.Tabs)
	}
}
