package accounts

import (
	"net/http"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// RegisterRequest represents the register request payload.
type RegisterRequest struct {
	//AccountID string `json:"account_id" binding:"required" example:"user123"`
	Email    string `json:"email" binding:"required" example:"user456"`
	Password string `json:"password" binding:"required" example:"securepassword123"`
}

// CreateNewAccountHandler registers a new account.
// @Summary Register
// @Description Registers a new user in the system
// @Tags auth
// @Accept json
// @Produce json
// @Param register body RegisterRequest true "Register payload"
// @Success 201
// @Failure 400 {string} string "Invalid input data"
// @Failure 409 {string} string "User already exists"
// @Failure 500 {string} string "Internal server error"
// @Router /auth/register [post]
func CreateNewAccountHandler(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		var registerReq RegisterRequest

		// Validate input data.
		if err := c.ShouldBindJSON(&registerReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"detail": err.Error(),
			})
			return
		}

		account, err := store.GetAccount(registerReq.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"detail": err.Error(),
			})
			return
		}

		if account != nil {
			c.JSON(http.StatusConflict, gin.H{
				"detail": "The user already exists",
			})
			return
		}

		if err := store.CreateNewAccount(storage.Account{ID: registerReq.Email, Password: registerReq.Password}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"detail": err.Error(),
			})
			return
		}

		c.Status(http.StatusCreated)
	}
}

// GetAllAccounts returns all registered accounts.
func GetAllAccounts(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		accounts, err := store.GetAllAccounts()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, accounts)
	}
}
