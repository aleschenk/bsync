package auth

import (
	"net/http"

	"bsync.com/m/v2/storage"
	"github.com/gin-gonic/gin"
)

// BasicMiddleware es el middleware de autenticación basica
func BasicMiddleware(store storage.Storage) gin.HandlerFunc {
	return func(c *gin.Context) {
		username, password, _ := c.Request.BasicAuth()
		if username == "" || password == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Credentials",
			})
			c.Abort()
			return
		}

		account, err := store.GetAccount(username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		if account.ID != username || account.Password != password {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			c.Abort()
			return
		}

		c.Set("accountId", account.ID)
		c.Next()
	}
}

// JWTMiddleware es el middleware de autenticación jwt
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener el token del header Authorization
		authHeader := c.GetHeader("Authorization")
		tokenString, err := ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Token de autorización requerido",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Validar el token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Token inválido",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Agregar los claims al contexto para uso posterior
		c.Set("account_id", claims.AccountID)
		c.Set("jwt_claims", claims)

		// Continuar con el siguiente handler
		c.Next()
	}
}

// RequireAccountAccess verifica que el usuario tenga acceso a la cuenta especificada
func RequireAccountAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener account_id del path parameter
		requestedAccountID := c.Param("accountId")
		if requestedAccountID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Account ID requerido",
			})
			c.Abort()
			return
		}

		// Obtener account_id del JWT claims
		accountID, exists := c.Get("account_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Información de autenticación no encontrada",
			})
			c.Abort()
			return
		}

		// Verificar que el usuario tenga acceso a esta cuenta
		if accountID != requestedAccountID {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "No tienes acceso a esta cuenta",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
