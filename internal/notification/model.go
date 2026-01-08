package notification

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	UserID  uint   `json:"user_id"`
	Message string `json:"message"`
	Read    bool   `json:"read" gorm:"default:false"`
}
