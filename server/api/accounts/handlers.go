package accounts

import (
	"net/http"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// RegisterRequest representa la estructura de la petición de registro
type RegisterRequest struct {
	//AccountID string `json:"account_id" binding:"required" example:"user123"`
	Email    string `json:"email" binding:"required" example:"user456"`
	Password string `json:"password" binding:"required" example:"securepassword123"`
}

// @Summary Register
// @Description Registra un nuevo usuario en el sistema
// @Tags auth
// @Accept json
// @Produce json
// @Param register body RegisterRequest true "Datos de registro"
// @Success 201
// @Failure 400 {string} string "Datos de entrada inválidos"
// @Failure 409 {string} string "Usuario ya existe"
// @Failure 500 {string} string "Error interno del servidor"
// @Router /auth/register [post]
func RegisterHandler(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		var registerReq RegisterRequest

		// Validar datos de entrada
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

		if err := store.CreateNewAccount(registerReq.Email); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"detail": err.Error(),
			})
			return
		}

		c.Status(http.StatusCreated)
	}
}
