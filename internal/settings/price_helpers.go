package settings

// GetApplicablePriceTierFromList devuelve el tier aplicable según la cantidad
// Recibe la lista de tiers como parámetro para evitar ciclo de importación
func GetApplicablePriceTierFromList(tiers []PriceTier, quantity int) *PriceTier {
	// Filtrar activos y ordenar por order_index
	activeTiers := make([]PriceTier, 0)
	for _, t := range tiers {
		if t.Active {
			activeTiers = append(activeTiers, t)
		}
	}

	// Ordenar por order_index (menor = mayor prioridad)
	for i := 0; i < len(activeTiers)-1; i++ {
		for j := i + 1; j < len(activeTiers); j++ {
			if activeTiers[j].OrderIndex < activeTiers[i].OrderIndex {
				activeTiers[i], activeTiers[j] = activeTiers[j], activeTiers[i]
			}
		}
	}

	var applicableTier *PriceTier

	// Buscar el tier con mayor prioridad que cumpla la condición
	for i := range activeTiers {
		tier := &activeTiers[i]
		if quantity >= tier.MinQuantity {
			if applicableTier == nil || tier.OrderIndex < applicableTier.OrderIndex {
				applicableTier = tier
			}
		}
	}

	// Si ninguno aplica, buscar el tier por defecto
	if applicableTier == nil {
		for i := range activeTiers {
			if activeTiers[i].IsDefault {
				applicableTier = &activeTiers[i]
				break
			}
		}
	}

	return applicableTier
}

// CalculatePriceForQuantityFromList calcula el precio usando una lista de tiers
func CalculatePriceForQuantityFromList(costPrice float64, quantity int, tiers []PriceTier) float64 {
	tier := GetApplicablePriceTierFromList(tiers, quantity)
	if tier == nil {
		return costPrice
	}
	return tier.CalculatePrice(costPrice)
}

// ProductPrices contiene los precios calculados para un producto
type ProductPrices struct {
	WholesalePrice float64 `json:"wholesale_price"`
	Discount1Price float64 `json:"discount1_price"`
	Discount2Price float64 `json:"discount2_price"`
}

// CalculateProductPricesFromList calcula precios usando una lista de tiers
func CalculateProductPricesFromList(costPrice float64, tiers []PriceTier) *ProductPrices {
	prices := &ProductPrices{
		WholesalePrice: costPrice * 2.5, // Fallback
		Discount1Price: costPrice * 2.25,
		Discount2Price: costPrice * 1.75,
	}

	// Buscar tiers por nombre
	for _, tier := range tiers {
		if !tier.Active {
			continue
		}
		price := tier.CalculatePrice(costPrice)
		switch tier.Name {
		case "wholesale":
			prices.WholesalePrice = price
		case "discount1":
			prices.Discount1Price = price
		case "discount2":
			prices.Discount2Price = price
		default:
			// Asignar por order_index como fallback
			if tier.OrderIndex == 3 {
				prices.WholesalePrice = price
			} else if tier.OrderIndex == 2 {
				prices.Discount1Price = price
			} else if tier.OrderIndex == 1 {
				prices.Discount2Price = price
			}
		}
	}

	return prices
}
