package auth

import (
	"net/http"
	"time"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// TokenResponse representa la respuesta de generación de token
type TokenResponse struct {
	Token     string    `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	ExpiresAt time.Time `json:"expires_at" example:"2024-01-21T19:30:45Z"`
	AccountID string    `json:"account_id" example:"user123"`
	UserID    string    `json:"user_id" example:"user456"`
}

// @Summary Generate API Token with Basic Auth
// @Description Genera un nuevo API token usando Basic Authentication
// @Tags auth
// @Accept json
// @Produce json
// @Param Authorization header string true "Basic Authentication (base64 encoded username:password)"
// @Success 200 {object} TokenResponse
// @Failure 401 {string} string "Credenciales inválidas"
// @Failure 500 {string} string "Error interno del servidor"
// @Router /auth/token [post]
func GenerateTokenHandler(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener el header Authorization

		//authHeader := c.GetHeader("Authorization")
		//if authHeader == "" {
		//	c.JSON(http.StatusUnauthorized, gin.H{
		//		"error": "Authorization header requerido",
		//	})
		//	return
		//}
		//
		//// Verificar que sea Basic Authentication
		//if !strings.HasPrefix(authHeader, "Basic ") {
		//	c.JSON(http.StatusUnauthorized, gin.H{
		//		"error": "Se requiere Basic Authentication",
		//	})
		//	return
		//}
		//
		//// Decodificar las credenciales
		//encoded := strings.TrimPrefix(authHeader, "Basic ")
		//decoded, err := base64.StdEncoding.DecodeString(encoded)
		//if err != nil {
		//	c.JSON(http.StatusUnauthorized, gin.H{
		//		"error": "Credenciales inválidas",
		//	})
		//	return
		//}
		//
		//// Separar usuario y contraseña
		//credentials := strings.SplitN(string(decoded), ":", 2)
		//if len(credentials) != 2 {
		//	c.JSON(http.StatusUnauthorized, gin.H{
		//		"error": "Formato de credenciales inválido",
		//	})
		//	return
		//}
		//
		//accountID := credentials[0]
		//password := credentials[1]

		// Verificar que la cuenta existe
		//_, err = store.GetAllSessions(accountID)
		//if err != nil {
		//	c.JSON(http.StatusUnauthorized, gin.H{
		//		"error": "Credenciales inválidas",
		//	})
		//	return
		//}
		//
		//// TODO: En una implementación real, aquí verificarías la contraseña
		//// Por ahora, solo verificamos que la cuenta existe
		//_ = password
		username, password, _ := c.Request.BasicAuth()
		existsAccount, err := store.ExistsAccount(username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"details": err.Error(),
			})
			return
		}

		if !existsAccount {
			c.JSON(http.StatusNotFound, gin.H{
				"details": "Invalid Account",
			})
			return
		}

		// Generar token
		token, err := GenerateToken(username, password)
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
		c.JSON(http.StatusOK, TokenResponse{
			Token:     token,
			ExpiresAt: expiresAt,
			AccountID: "",
			UserID:    "",
		})
	}
}

// @Summary Refresh Token
// @Description Refresca un JWT token existente
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} TokenResponse
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
		c.JSON(http.StatusOK, TokenResponse{
			Token:     token,
			ExpiresAt: expiresAt,
			AccountID: jwtClaims.AccountID,
			UserID:    jwtClaims.UserID,
		})
	}
}
