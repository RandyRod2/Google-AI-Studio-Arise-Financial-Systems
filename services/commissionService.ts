
import { CommissionRegistry, CommissionRule } from '../types';
import { INITIAL_REGISTRY_DATA } from './mockData';

export const getCommissionRegistry = (): CommissionRegistry => {
    try {
        const saved = localStorage.getItem('arise_commission_registry');
        return saved ? JSON.parse(saved) : INITIAL_REGISTRY_DATA;
    } catch {
        return INITIAL_REGISTRY_DATA;
    }
};

export const getAvailableCarriers = (): string[] => {
    const registry = getCommissionRegistry();
    return Object.keys(registry).sort();
};

export const getAvailableProducts = (carrier: string): string[] => {
    const registry = getCommissionRegistry();
    if (!registry[carrier]) return [];
    return Object.keys(registry[carrier]).sort();
};

/**
 * Retrieves the specific commission rates (FYC and Renewals) for a given level.
 * Uses linear interpolation to calculate rates between defined contract levels.
 * 
 * @param carrier 
 * @param product 
 * @param compLevel 
 * @param providedRegistry Optional override for the registry source (useful for previews/editing)
 */
export const getCommissionRate = (
    carrier: string, 
    product: string, 
    compLevel: number,
    providedRegistry?: CommissionRegistry
): { fyc: number, renewals: number } => {
    const registry = providedRegistry || getCommissionRegistry();
    
    // 1. Find Carrier (Case insensitive search)
    const carrierKey = Object.keys(registry).find(k => k.toLowerCase() === carrier.toLowerCase());
    if (!carrierKey) return { fyc: 0, renewals: 0 };

    // 2. Find Product (Case insensitive search)
    const productData = registry[carrierKey];
    const productKey = Object.keys(productData).find(k => k.toLowerCase() === product.toLowerCase());
    if (!productKey) return { fyc: 0, renewals: 0 };

    const levelsData = productData[productKey];
    const levelKey = compLevel.toString();

    // 3. Exact Match Check
    if (levelsData[levelKey]) {
        return levelsData[levelKey];
    }

    // 4. Interpolation Logic
    const sortedLevels = Object.keys(levelsData)
        .map(Number)
        .sort((a, b) => a - b); // Ascending order

    // Find the bounding levels (lower and upper)
    let lowerLevel: number | null = null;
    let upperLevel: number | null = null;

    for (const lvl of sortedLevels) {
        if (lvl <= compLevel) lowerLevel = lvl;
        if (lvl >= compLevel && upperLevel === null) upperLevel = lvl;
    }

    // Case: Level is below minimum defined (Use lowest defined rate)
    if (lowerLevel === null && upperLevel !== null) {
        const rule = levelsData[upperLevel.toString()];
        return { fyc: rule.fyc, renewals: rule.renewals };
    }

    // Case: Level is above maximum defined (Use highest defined rate)
    if (upperLevel === null && lowerLevel !== null) {
        const rule = levelsData[lowerLevel.toString()];
        return { fyc: rule.fyc, renewals: rule.renewals };
    }

    // Case: Bounded between two known levels -> Linear Interpolation
    if (lowerLevel !== null && upperLevel !== null && lowerLevel !== upperLevel) {
        const lowerRule = levelsData[lowerLevel.toString()];
        const upperRule = levelsData[upperLevel.toString()];

        // Linear Formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
        const ratio = (compLevel - lowerLevel) / (upperLevel - lowerLevel);
        
        const fyc = lowerRule.fyc + (upperRule.fyc - lowerRule.fyc) * ratio;
        const renewals = lowerRule.renewals + (upperRule.renewals - lowerRule.renewals) * ratio;
        
        return {
            fyc: parseFloat(fyc.toFixed(4)), // Avoid floating point drift
            renewals: parseFloat(renewals.toFixed(4))
        };
    }

    // Default Fallback
    return { fyc: compLevel / 100, renewals: 0 };
};

/**
 * Calculates the exact commission total based on the interpolated rate.
 */
export const calculateCommissionExact = (
    carrier: string, 
    product: string, 
    premium: number, 
    compLevel: number
): { total: number, fycRate: number } => {
    
    if (!carrier || !product) {
        return {
            total: premium * (compLevel / 100),
            fycRate: compLevel / 100
        };
    }

    const { fyc } = getCommissionRate(carrier, product, compLevel);

    return {
        total: premium * fyc,
        fycRate: fyc
    };
};
