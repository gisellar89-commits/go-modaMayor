package audit

import (
	"go-modaMayor/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Listar logs de auditoría por entidad e ID
func ListAuditLogsByEntity(c *gin.Context) {
	entity := c.Param("entity")
	id := c.Param("id")
	var logs []AuditLog
	if err := config.DB.Where("entity = ? AND entity_id = ?", entity, id).Order("created_at desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}
