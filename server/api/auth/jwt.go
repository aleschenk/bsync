package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims representa los claims del JWT
type JWTClaims struct {
	AccountID string `json:"account_id"`
	UserID    string `json:"user_id"`
	jwt.RegisteredClaims
}

var (
	// JWTSecret se obtiene de variable de entorno
	JWTSecret = getJWTSecret()
	// JWTExpirationTime tiempo de expiración del token (24 horas por defecto)
	JWTExpirationTime = 24 * time.Hour
)

// getJWTSecret obtiene el secret JWT de las variables de entorno
func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// En desarrollo, usar un secret por defecto (NO usar en producción)
		return "bsync-development-secret-key-change-in-production"
	}
	return secret
}

// GenerateToken genera un nuevo JWT token para un usuario
func GenerateToken(accountID, userID string) (string, error) {
	claims := JWTClaims{
		AccountID: accountID,
		UserID:    userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(JWTExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "bsync-server",
			Subject:   accountID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(JWTSecret))
	if err != nil {
		return "", fmt.Errorf("error generando token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken valida un JWT token y retorna los claims
func ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el método de firma sea el esperado
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return []byte(JWTSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("error parseando token: %w", err)
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido")
}

// ExtractTokenFromHeader extrae el token del header Authorization
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("header de autorización faltante")
	}

	// Verificar formato "Bearer <token>"
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return "", errors.New("formato de autorización inválido, se espera 'Bearer <token>'")
	}

	return authHeader[7:], nil
}
