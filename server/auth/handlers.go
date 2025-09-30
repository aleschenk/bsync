package auth

import (
	"net/http"
	"time"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// LoginRequest representa la estructura de la petición de login
type LoginRequest struct {
	AccountID string `json:"account_id" binding:"required" example:"user123"`
	UserID    string `json:"user_id" binding:"required" example:"user456"`
}

// LoginResponse representa la respuesta del login
type LoginResponse struct {
	Token     string    `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	ExpiresAt time.Time `json:"expires_at" example:"2024-01-21T19:30:45Z"`
	AccountID string    `json:"account_id" example:"user123"`
	UserID    string    `json:"user_id" example:"user456"`
}

// @Summary Login
// @Description Autentica un usuario y retorna un JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param login body LoginRequest true "Credenciales de login"
// @Success 200 {object} LoginResponse
// @Failure 400 {string} string "Datos de entrada inválidos"
// @Failure 401 {string} string "Credenciales inválidas"
// @Failure 500 {string} string "Error interno del servidor"
// @Router /auth/login [post]
func LoginHandler(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		var loginReq LoginRequest

		// Validar datos de entrada
		if err := c.ShouldBindJSON(&loginReq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Datos de entrada inválidos",
				"details": err.Error(),
			})
			return
		}

		// Verificar que la cuenta existe
		// Nota: En una implementación real, aquí verificarías las credenciales
		// contra una base de datos de usuarios. Por ahora, solo verificamos que la cuenta existe.
		_, err := store.GetAllSessions(loginReq.AccountID)
		if err != nil {
			// Si no puede obtener sesiones, la cuenta no existe
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Credenciales inválidas",
			})
			return
		}

		// Generar token JWT
		token, err := GenerateToken(loginReq.AccountID, loginReq.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Error generando token",
				"details": err.Error(),
			})
			return
		}

		// Calcular tiempo de expiración
		expiresAt := time.Now().Add(JWTExpirationTime)

		// Retornar respuesta exitosa
		c.JSON(http.StatusOK, LoginResponse{
			Token:     token,
			ExpiresAt: expiresAt,
			AccountID: loginReq.AccountID,
			UserID:    loginReq.UserID,
		})
	}
}

// @Summary Refresh Token
// @Description Refresca un JWT token existente
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} LoginResponse
// @Failure 401 {string} string "Token inválido o expirado"
// @Failure 500 {string} string "Error interno del servidor"
// @Router /auth/refresh [post]
func RefreshTokenHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener claims del contexto (ya validados por el middleware)
		claims, exists := c.Get("jwt_claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido",
			})
			return
		}

		jwtClaims := claims.(*JWTClaims)

		// Generar nuevo token
		token, err := GenerateToken(jwtClaims.AccountID, jwtClaims.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Error generando token",
				"details": err.Error(),
			})
			return
		}

		// Calcular tiempo de expiración
		expiresAt := time.Now().Add(JWTExpirationTime)

		// Retornar respuesta exitosa
		c.JSON(http.StatusOK, LoginResponse{
			Token:     token,
			ExpiresAt: expiresAt,
			AccountID: jwtClaims.AccountID,
			UserID:    jwtClaims.UserID,
		})
	}
}
