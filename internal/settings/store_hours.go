package settings

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var db *gorm.DB

// SetDB asigna la instancia de base de datos
func SetDB(database *gorm.DB) {
	db = database
}

// StoreHours representa la configuración de horarios de la tienda
type StoreHours struct {
	ID                     uint       `gorm:"primarykey" json:"id"`
	WeekdayMorningOpen     *time.Time `json:"weekday_morning_open"`
	WeekdayMorningClose    *time.Time `json:"weekday_morning_close"`
	WeekdayAfternoonOpen   *time.Time `json:"weekday_afternoon_open"`
	WeekdayAfternoonClose  *time.Time `json:"weekday_afternoon_close"`
	SaturdayMorningOpen    *time.Time `json:"saturday_morning_open"`
	SaturdayMorningClose   *time.Time `json:"saturday_morning_close"`
	SaturdayAfternoonOpen  *time.Time `json:"saturday_afternoon_open"`
	SaturdayAfternoonClose *time.Time `json:"saturday_afternoon_close"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

// StoreHoliday representa un feriado o día no laborable
type StoreHoliday struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Date      time.Time `gorm:"type:date;uniqueIndex" json:"date"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// GetStoreHours obtiene la configuración de horarios
func GetStoreHours(c *gin.Context) {
	var hours StoreHours
	if err := db.First(&hours).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, StoreHours{}) // Retorna objeto vacío si no existe
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, hours)
}

// UpdateStoreHours actualiza la configuración de horarios
func UpdateStoreHours(c *gin.Context) {
	var input struct {
		WeekdayMorningOpen     string `json:"weekday_morning_open"`
		WeekdayMorningClose    string `json:"weekday_morning_close"`
		WeekdayAfternoonOpen   string `json:"weekday_afternoon_open"`
		WeekdayAfternoonClose  string `json:"weekday_afternoon_close"`
		SaturdayMorningOpen    string `json:"saturday_morning_open"`
		SaturdayMorningClose   string `json:"saturday_morning_close"`
		SaturdayAfternoonOpen  string `json:"saturday_afternoon_open"`
		SaturdayAfternoonClose string `json:"saturday_afternoon_close"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var hours StoreHours
	err := db.First(&hours).Error
	if err == gorm.ErrRecordNotFound {
		// Crear nuevo registro
		hours = StoreHours{}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Parsear horarios con fecha base fija (2000-01-01) para que PostgreSQL los maneje correctamente
	parseTime := func(s string) (*time.Time, error) {
		if s == "" {
			return nil, nil
		}
		// Usar fecha base 2000-01-01 + hora
		t, err := time.Parse("2006-01-02 15:04", "2000-01-01 "+s)
		if err != nil {
			return nil, err
		}
		return &t, nil
	}

	var parseErr error
	hours.WeekdayMorningOpen, parseErr = parseTime(input.WeekdayMorningOpen)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("weekday_morning_open: %v", parseErr)})
		return
	}

	hours.WeekdayMorningClose, parseErr = parseTime(input.WeekdayMorningClose)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("weekday_morning_close: %v", parseErr)})
		return
	}

	hours.WeekdayAfternoonOpen, parseErr = parseTime(input.WeekdayAfternoonOpen)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("weekday_afternoon_open: %v", parseErr)})
		return
	}

	hours.WeekdayAfternoonClose, parseErr = parseTime(input.WeekdayAfternoonClose)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("weekday_afternoon_close: %v", parseErr)})
		return
	}

	hours.SaturdayMorningOpen, parseErr = parseTime(input.SaturdayMorningOpen)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("saturday_morning_open: %v", parseErr)})
		return
	}

	hours.SaturdayMorningClose, parseErr = parseTime(input.SaturdayMorningClose)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("saturday_morning_close: %v", parseErr)})
		return
	}

	hours.SaturdayAfternoonOpen, parseErr = parseTime(input.SaturdayAfternoonOpen)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("saturday_afternoon_open: %v", parseErr)})
		return
	}

	hours.SaturdayAfternoonClose, parseErr = parseTime(input.SaturdayAfternoonClose)
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("saturday_afternoon_close: %v", parseErr)})
		return
	}

	if err := db.Save(&hours).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hours)
}

// ListHolidays lista todos los feriados
func ListHolidays(c *gin.Context) {
	var holidays []StoreHoliday
	if err := db.Order("date ASC").Find(&holidays).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, holidays)
}

// CreateHoliday crea un nuevo feriado
func CreateHoliday(c *gin.Context) {
	var input struct {
		Date string `json:"date" binding:"required"`
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de fecha inválido (use YYYY-MM-DD)"})
		return
	}

	holiday := StoreHoliday{
		Date: date,
		Name: input.Name,
	}

	if err := db.Create(&holiday).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, holiday)
}

// DeleteHoliday elimina un feriado
func DeleteHoliday(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&StoreHoliday{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Feriado eliminado"})
}

// IsStoreOpen verifica si la tienda está abierta en un momento dado
func IsStoreOpen(t time.Time) (bool, error) {
	// Verificar si es feriado
	var holiday StoreHoliday
	err := db.Where("date = ?", t.Format("2006-01-02")).First(&holiday).Error
	if err == nil {
		return false, nil // Es feriado
	} else if err != nil && err != gorm.ErrRecordNotFound {
		return false, err
	}

	// Obtener configuración de horarios
	var hours StoreHours
	if err := db.First(&hours).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil // No hay configuración
		}
		return false, err
	}

	weekday := t.Weekday()
	currentTime := t.Format("15:04")

	// Domingo siempre cerrado
	if weekday == time.Sunday {
		return false, nil
	}

	// Sábado
	if weekday == time.Saturday {
		return isTimeInRange(currentTime, hours.SaturdayMorningOpen, hours.SaturdayMorningClose) ||
			isTimeInRange(currentTime, hours.SaturdayAfternoonOpen, hours.SaturdayAfternoonClose), nil
	}

	// Lunes a Viernes
	return isTimeInRange(currentTime, hours.WeekdayMorningOpen, hours.WeekdayMorningClose) ||
		isTimeInRange(currentTime, hours.WeekdayAfternoonOpen, hours.WeekdayAfternoonClose), nil
}

// isTimeInRange verifica si un tiempo está dentro de un rango
func isTimeInRange(current string, start, end *time.Time) bool {
	if start == nil || end == nil {
		return false
	}
	startStr := start.Format("15:04")
	endStr := end.Format("15:04")
	return current >= startStr && current <= endStr
}

// GetNextOpeningTime calcula el próximo momento en que la tienda estará abierta
func GetNextOpeningTime(t time.Time) (time.Time, error) {
	// Obtener configuración de horarios
	var hours StoreHours
	if err := db.First(&hours).Error; err != nil {
		return time.Time{}, err
	}

	maxDays := 30
	for i := 0; i < maxDays; i++ {
		candidate := t.AddDate(0, 0, i)
		weekday := candidate.Weekday()
		
		// Omitir domingos
		if weekday == time.Sunday {
			continue
		}
		
		// Verificar si es feriado
		var holiday StoreHoliday
		err := db.Where("date = ?", candidate.Format("2006-01-02")).First(&holiday).Error
		if err == nil {
			// Es feriado, saltar
			continue
		}

		// Determinar hora de apertura según el día
		var openTime *time.Time
		if weekday == time.Saturday && hours.SaturdayMorningOpen != nil {
			openTime = hours.SaturdayMorningOpen
		} else if weekday >= time.Monday && weekday <= time.Friday && hours.WeekdayMorningOpen != nil {
			openTime = hours.WeekdayMorningOpen
		}

		if openTime != nil {
			nextOpening := time.Date(
				candidate.Year(), candidate.Month(), candidate.Day(),
				openTime.Hour(), openTime.Minute(), 0, 0, candidate.Location(),
			)
			
			// Si es el mismo día y ya pasó la hora de cierre, probar mañana
			if i == 0 && nextOpening.Before(t) {
				// Si aún estamos en horario de mañana pero ya pasó, probar horario tarde
				var afternoonOpen *time.Time
				if weekday == time.Saturday && hours.SaturdayAfternoonOpen != nil {
					afternoonOpen = hours.SaturdayAfternoonOpen
				} else if weekday >= time.Monday && weekday <= time.Friday && hours.WeekdayAfternoonOpen != nil {
					afternoonOpen = hours.WeekdayAfternoonOpen
				}
				
				if afternoonOpen != nil {
					afternoonTime := time.Date(
						candidate.Year(), candidate.Month(), candidate.Day(),
						afternoonOpen.Hour(), afternoonOpen.Minute(), 0, 0, candidate.Location(),
					)
					if afternoonTime.After(t) {
						return afternoonTime, nil
					}
				}
				continue
			}
			
			return nextOpening, nil
		}
	}

	return time.Time{}, fmt.Errorf("no se encontró fecha de apertura en los próximos %d días", maxDays)
}
