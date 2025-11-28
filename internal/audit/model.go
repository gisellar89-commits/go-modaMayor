package audit

import (
	"gorm.io/gorm"
)

type AuditLog struct {
	gorm.Model
	UserID   uint   `json:"user_id"`
	Action   string `json:"action"`
	Entity   string `json:"entity"`
	EntityID uint   `json:"entity_id"`
	Details  string `json:"details"`
}
