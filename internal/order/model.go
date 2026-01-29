package order

import (
	"go-modaMayor/internal/user"
	"gorm.io/gorm"
)

type Order struct {
	gorm.Model
	UserID uint        `json:"user_id"`
	User   user.User   `json:"User" gorm:"foreignKey:UserID"`
	CartID *uint       `json:"cart_id" gorm:"index"` // Referencia al carrito original
	Total  float64     `json:"total"`
	Status string      `json:"status"`
	Items  []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	// AssignedTo: vendedor (user.id) que quedó a cargo de la compra; puede estar vacío hasta asignación
	AssignedTo     uint       `json:"assigned_to" gorm:"default:0"`
	AssignedToUser *user.User `json:"AssignedToUser" gorm:"foreignKey:AssignedTo"`
	// Payment details (simple): método y referencia cuando corresponda
	PaymentMethod    string `json:"payment_method" gorm:"size:64"`
	PaymentReference string `json:"payment_reference" gorm:"size:255"`
	// Puedes agregar más campos como dirección, etc.
}

// Agregar campos para asignación a vendedor y método de pago/nota
type OrderAssignment struct {
	AssignedTo uint `json:"assigned_to"`
}

// Extendemos Order con campos tacitos (no rompe migración porque GORM ignora tipos no usados directamente)

// RoundRobinState mantiene el último vendedor asignado para la rotación
type RoundRobinState struct {
	gorm.Model
	Key          string `json:"key" gorm:"uniqueIndex;size:64"`
	LastAssigned uint   `json:"last_assigned"`
}
