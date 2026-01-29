package settings

import "log"

// GetApplicablePriceTierFromList devuelve el tier aplicable según la cantidad
// Recibe la lista de tiers como parámetro para evitar ciclo de importación
func GetApplicablePriceTierFromList(tiers []PriceTier, quantity int) *PriceTier {
	log.Printf("[DEBUG GetApplicablePriceTier] Buscando tier para quantity=%d", quantity)
	
	// Filtrar activos y ordenar por order_index
	activeTiers := make([]PriceTier, 0)
	for _, t := range tiers {
		if t.Active {
			activeTiers = append(activeTiers, t)
			log.Printf("[DEBUG GetApplicablePriceTier] Tier activo: %s (min=%d, order_index=%d)", t.Name, t.MinQuantity, t.OrderIndex)
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

	// Buscar el tier con mayor MinQuantity que cumpla la condición
	for i := range activeTiers {
		tier := &activeTiers[i]
		log.Printf("[DEBUG GetApplicablePriceTier] Evaluando tier: %s (min=%d, cumple=%v)", tier.Name, tier.MinQuantity, quantity >= tier.MinQuantity)
		if quantity >= tier.MinQuantity {
			if applicableTier == nil || tier.MinQuantity > applicableTier.MinQuantity {
				applicableTier = tier
				log.Printf("[DEBUG GetApplicablePriceTier] Tier seleccionado: %s", tier.Name)
			}
		}
	}

	// Si ninguno aplica, buscar el tier por defecto
	if applicableTier == nil {
		for i := range activeTiers {
			if activeTiers[i].IsDefault {
				applicableTier = &activeTiers[i]
				log.Printf("[DEBUG GetApplicablePriceTier] Usando tier por defecto: %s", applicableTier.Name)
				break
			}
		}
	}

	if applicableTier != nil {
		log.Printf("[DEBUG GetApplicablePriceTier] RESULTADO FINAL: tier=%s (min=%d, order_index=%d)", applicableTier.Name, applicableTier.MinQuantity, applicableTier.OrderIndex)
	} else {
		log.Printf("[DEBUG GetApplicablePriceTier] RESULTADO FINAL: sin tier aplicable")
	}

	return applicableTier
}

// CalculatePriceForQuantityFromList calcula el precio usando una lista de tiers
func CalculatePriceForQuantityFromList(costPrice float64, quantity int, tiers []PriceTier) float64 {
	log.Printf("[DEBUG CalculatePriceForQuantityFromList] INPUT: costPrice=%.2f, quantity=%d, tiers=%d", 
		costPrice, quantity, len(tiers))
	
	tier := GetApplicablePriceTierFromList(tiers, quantity)
	if tier == nil {
		log.Printf("[DEBUG CalculatePriceForQuantityFromList] No tier found, returning costPrice=%.2f", costPrice)
		return costPrice
	}
	
	log.Printf("[DEBUG CalculatePriceForQuantityFromList] Tier encontrado: Name=%s, FormulaType=%s, Multiplier=%.2f, MinQty=%d", 
		tier.Name, tier.FormulaType, tier.Multiplier, tier.MinQuantity)
	
	calculatedPrice := tier.CalculatePrice(costPrice)
	
	log.Printf("[DEBUG CalculatePriceForQuantityFromList] OUTPUT: calculatedPrice=%.2f", calculatedPrice)
	
	return calculatedPrice
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
