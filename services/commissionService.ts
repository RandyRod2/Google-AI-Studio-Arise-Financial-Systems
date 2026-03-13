import { CommissionRegistry, CommissionRule, TeamMember, OverrideRecord, Policy } from '../types';
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
): { fyc: number, renewals: number, advanceRate?: string, chargebackPeriod?: string } => {
    const registry = providedRegistry || getCommissionRegistry();
    
    // 1. Find Carrier (Case insensitive search)
    const carrierKey = Object.keys(registry).find(k => k.toLowerCase() === carrier.toLowerCase());
    if (!carrierKey) return { fyc: 0, renewals: 0, advanceRate: '75%', chargebackPeriod: '9mo' };

    // 2. Find Product (Case insensitive search)
    const productData = registry[carrierKey];
    const productKey = Object.keys(productData).find(k => k.toLowerCase() === product.toLowerCase());
    if (!productKey) return { fyc: 0, renewals: 0, advanceRate: '75%', chargebackPeriod: '9mo' };

    const levelsData = productData[productKey];
    const levelKey = compLevel.toString();

    // 3. Exact Match Check
    if (levelsData[levelKey]) {
        const rule = levelsData[levelKey];
        return { 
            fyc: rule.fyc, 
            renewals: rule.renewals, 
            advanceRate: rule.advanceRate || '75%', 
            chargebackPeriod: rule.chargebackPeriod || '9mo' 
        };
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
        return { 
            fyc: rule.fyc, 
            renewals: rule.renewals,
            advanceRate: rule.advanceRate || '75%',
            chargebackPeriod: rule.chargebackPeriod || '9mo'
        };
    }

    // Case: Level is above maximum defined (Use highest defined rate)
    if (upperLevel === null && lowerLevel !== null) {
        const rule = levelsData[lowerLevel.toString()];
        return { 
            fyc: rule.fyc, 
            renewals: rule.renewals,
            advanceRate: rule.advanceRate || '75%',
            chargebackPeriod: rule.chargebackPeriod || '9mo'
        };
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
            renewals: parseFloat(renewals.toFixed(4)),
            // Picking categorical fields from lower bounding level
            advanceRate: lowerRule.advanceRate || '75%',
            chargebackPeriod: lowerRule.chargebackPeriod || '9mo'
        };
    }

    // Default Fallback
    return { fyc: compLevel / 100, renewals: 0, advanceRate: '75%', chargebackPeriod: '9mo' };
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

/**
 * Automation: Processes a newly issued policy to compute and store manager overrides.
 * Walks up the hierarchy and calculates spreads.
 */
export const processPolicyOverrides = (
    policy: Policy,
    writingAgentId: string,
    teamMembers: TeamMember[]
) => {
    const storedOverridesRaw = localStorage.getItem('arise_overrides_v1');
    let overrides: OverrideRecord[] = storedOverridesRaw ? JSON.parse(storedOverridesRaw) : [];

    const writingAgent = teamMembers.find(m => m.id === writingAgentId || (m.id === 't1' && writingAgentId === 'u1'));
    if (!writingAgent) return;

    let currentLowerLevel = writingAgent.defaultCompLevel;
    let currentManagerId = writingAgent.parentId;

    while (currentManagerId) {
        const manager = teamMembers.find(m => m.id === currentManagerId);
        if (!manager) break;

        // Duplicate Check: policyId + managerId
        const exists = overrides.some(o => o.policyId === policy.id && o.managerId === manager.id);
        if (exists) {
            // Traverse up without inserting to maintain chain consistency
            currentLowerLevel = manager.defaultCompLevel;
            currentManagerId = manager.parentId;
            continue;
        }

        const managerLevel = manager.defaultCompLevel;
        const spreadPercent = Math.max(0, managerLevel - currentLowerLevel);
        
        if (spreadPercent > 0) {
            const overrideAmount = policy.premium * (spreadPercent / 100);
            
            const newOverride: OverrideRecord = {
                id: `ovr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                policyId: policy.id,
                writingAgentId: writingAgent.id,
                writingAgentName: writingAgent.name,
                managerId: manager.id,
                managerName: manager.name,
                amount: overrideAmount,
                percentage: spreadPercent,
                premium: policy.premium,
                carrier: policy.carrier,
                product: policy.productName || 'Unknown Product',
                timestamp: new Date().toISOString()
            };
            
            overrides.push(newOverride);
        }

        // Move up the chain
        currentLowerLevel = managerLevel;
        currentManagerId = manager.parentId;
    }

    localStorage.setItem('arise_overrides_v1', JSON.stringify(overrides));
};
