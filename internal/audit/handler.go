package audit

import (
	"go-modaMayor/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Listar logs de auditoría (solo admin)
func ListAuditLogs(c *gin.Context) {
	var logs []AuditLog
	if err := config.DB.Order("created_at desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
