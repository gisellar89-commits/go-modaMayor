package user

import (
	"crypto/rand"
	"encoding/hex"
	"go-modaMayor/config"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
)

// Generar token aleatorio
func generateResetToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// Solicitar recuperación de contraseña
func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Si el email existe, se enviará un enlace"})
		return
	}
	token := generateResetToken()
	expires := time.Now().Add(1 * time.Hour)
	user.ResetToken = token
	user.ResetExpiresAt = expires
	config.DB.Save(&user)
	// Simular envío de email (en consola)
	c.JSON(http.StatusOK, gin.H{"message": "Enlace enviado (simulado)", "reset_url": "/reset-password?token=" + token})
}

// Restablecer contraseña
func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user User
	if err := config.DB.Where("reset_token = ? AND reset_expires_at > ?", input.Token, time.Now()).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token inválido o expirado"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al hashear contraseña"})
		return
	}
	user.Password = string(hash)
	user.ResetToken = ""
	user.ResetExpiresAt = time.Time{}
	config.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Contraseña restablecida"})
}
