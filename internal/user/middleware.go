package user

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Middleware para proteger rutas con JWT
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token requerido"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := ValidateJWT(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			return
		}
		// Puedes guardar los claims en el contexto para usarlos en los handlers
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

// Middleware opcional: intenta autenticar pero no rechaza si no hay token
// Usado para endpoints que funcionan con o sin autenticación
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header != "" && strings.HasPrefix(header, "Bearer ") {
			tokenStr := strings.TrimPrefix(header, "Bearer ")
			claims, err := ValidateJWT(tokenStr)
			if err == nil {
				// Token válido: guardar claims en contexto
				c.Set("user_id", claims.UserID)
				c.Set("user_email", claims.Email)
				c.Set("user_role", claims.Role)
			}
			// Si el token es inválido, simplemente continuar sin autenticación
		}
		// Continuar sin importar si hay token o no
		c.Next()
	}
}

// Middleware para requerir un rol específico
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, ok := c.Get("user_role")
		if !ok || userRole != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acceso denegado: se requiere rol " + role})
			return
		}
		c.Next()
	}
}

// Middleware para requerir uno de varios roles
func RequireAnyRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, ok := c.Get("user_role")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acceso denegado: se requiere rol"})
			return
		}
		for _, r := range roles {
			if userRole == r {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acceso denegado: se requiere uno de los roles: " + strings.Join(roles, ", ")})
	}
}
