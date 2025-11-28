// Utilidades para cálculo de precios según price tiers configurables

export interface PriceTier {
  ID: number;
  name: string;
  display_name: string;
  formula_type: 'multiplier' | 'percentage_markup' | 'flat_amount';
  multiplier: number;
  percentage: number;
  flat_amount: number;
  min_quantity: number;
  order_index: number;
  active: boolean;
  description: string;
  is_default: boolean;
  show_in_public: boolean;
  color_code: string;
}

export interface CalculatedPriceInfo {
  price: number;
  tier: PriceTier | null;
  allTiers: Array<{
    tier: PriceTier;
    price: number;
    applies: boolean;
  }>;
}

/**
 * Calcula el precio según el tier y el costo
 */
export function calculatePriceForTier(costPrice: number, tier: PriceTier): number {
  switch (tier.formula_type) {
    case 'multiplier':
      return costPrice * tier.multiplier;
    case 'percentage_markup':
      return costPrice + (costPrice * tier.percentage / 100.0);
    case 'flat_amount':
      return costPrice + tier.flat_amount;
    default:
      return costPrice;
  }
}

/**
 * Obtiene el tier aplicable según la cantidad
 */
export function getApplicableTier(tiers: PriceTier[], quantity: number): PriceTier | null {
  if (!tiers || tiers.length === 0) return null;

  // Filtrar tiers activos y ordenar por order_index
  const activeTiers = tiers
    .filter(t => t.active)
    .sort((a, b) => a.order_index - b.order_index);

  // Buscar el tier con mayor prioridad que cumpla la condición
  let applicableTier: PriceTier | null = null;

  for (const tier of activeTiers) {
    if (quantity >= tier.min_quantity) {
      if (!applicableTier || tier.order_index < applicableTier.order_index) {
        applicableTier = tier;
      }
    }
  }

  // Si ninguno aplica, usar el default
  if (!applicableTier) {
    applicableTier = activeTiers.find(t => t.is_default) || null;
  }

  return applicableTier;
}

/**
 * Calcula el precio para una cantidad específica
 */
export function calculatePriceForQuantity(
  costPrice: number,
  quantity: number,
  tiers: PriceTier[]
): CalculatedPriceInfo {
  const tier = getApplicableTier(tiers, quantity);
  const price = tier ? calculatePriceForTier(costPrice, tier) : costPrice;

  // Calcular todos los tiers para mostrar opciones
  const allTiers = tiers
    .filter(t => t.active)
    .sort((a, b) => a.order_index - b.order_index)
    .map(t => ({
      tier: t,
      price: calculatePriceForTier(costPrice, t),
      applies: quantity >= t.min_quantity,
    }));

  return {
    price,
    tier,
    allTiers,
  };
}

/**
 * Obtiene todos los price tiers desde el backend
 */
export async function fetchPriceTiers(): Promise<PriceTier[]> {
  try {
    const res = await fetch('http://localhost:8080/settings/price-tiers');
    const data = await res.json();
    return data.tiers || [];
  } catch (error) {
    console.error('Error al obtener price tiers:', error);
    return [];
  }
}

/**
 * Calcula precios del backend (opcional, usa el endpoint de cálculo)
 */
export async function calculatePricesFromBackend(
  costPrice: number,
  quantity: number
): Promise<CalculatedPriceInfo | null> {
  try {
    const res = await fetch(
      `http://localhost:8080/settings/price-tiers/calculate?cost_price=${costPrice}&quantity=${quantity}`
    );
    const data = await res.json();
    
    if (!data.tiers) return null;

    const applicableTier = data.tiers.find((t: any) => t.applies_now);
    
    return {
      price: applicableTier ? applicableTier.calculated_price : costPrice,
      tier: applicableTier || null,
      allTiers: data.tiers.map((t: any) => ({
        tier: t,
        price: t.calculated_price,
        applies: t.applies_now,
      })),
    };
  } catch (error) {
    console.error('Error al calcular precios desde backend:', error);
    return null;
  }
}

/**
 * Formatea un precio en pesos argentinos
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Obtiene descripción legible de la fórmula
 */
export function getFormulaDescription(tier: PriceTier): string {
  switch (tier.formula_type) {
    case 'multiplier':
      return `Costo × ${tier.multiplier}`;
    case 'percentage_markup':
      return `Costo + ${tier.percentage}%`;
    case 'flat_amount':
      return `Costo + $${tier.flat_amount}`;
    default:
      return 'Fórmula desconocida';
  }
}

/**
 * Calcula precios estáticos (fallback para compatibilidad con código legacy)
 * Estos valores deberían coincidir con los tiers iniciales de la migración
 */
export function calculateLegacyPrices(costPrice: number) {
  return {
    retail: costPrice,
    wholesale: costPrice * 2.5,
    discount1: costPrice * 2.25,
    discount2: costPrice * 1.75,
  };
}
