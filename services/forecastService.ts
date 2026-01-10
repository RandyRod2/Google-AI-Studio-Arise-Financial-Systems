
import { Client, PipelineStage, RevenueForecast, ConfidenceBand } from '../types';

const STAGE_WEIGHTS: Record<PipelineStage, number> = {
    [PipelineStage.ISSUED]: 1.0,
    [PipelineStage.UNDERWRITING]: 0.85,
    [PipelineStage.APPLICATION_TAKEN]: 0.65,
    [PipelineStage.APPOINTMENT_SET]: 0.20,
    [PipelineStage.CONTACTED]: 0.05,
    [PipelineStage.NEW_LEAD]: 0.02,
    [PipelineStage.RENEWAL_REVIEW]: 0.80,
    [PipelineStage.NOT_INTERESTED]: 0,
    [PipelineStage.BAD_NUMBER]: 0
};

export const calculateRevenueForecast = (clients: Client[]): RevenueForecast => {
    // 1. Fetch historical activity (Velocity)
    const historyRaw = localStorage.getItem('arise_kpi_history_v2');
    const history = historyRaw ? JSON.parse(historyRaw) : {};
    
    // Calculate Average Daily Premium from last 30 days
    const dates = Object.keys(history).sort().reverse().slice(0, 30);
    const totalHistoricalPremium = dates.reduce((sum, d) => sum + (history[d].totalPremium || 0), 0);
    const avgDailyPremium = dates.length > 0 ? totalHistoricalPremium / dates.length : 0;
    
    // Calculate Velocity Factor (Last 7 days vs Average)
    const recentDates = dates.slice(0, 7);
    const recentAvg = recentDates.length > 0 
        ? recentDates.reduce((sum, d) => sum + (history[d].totalPremium || 0), 0) / recentDates.length 
        : avgDailyPremium;
    
    const velocityFactor = avgDailyPremium > 0 ? Math.min(1.5, Math.max(0.5, recentAvg / avgDailyPremium)) : 1.0;

    // 2. Process Pipeline Weighted Value
    const getWeightedValue = (periodDays: number) => {
        return clients.reduce((acc, client) => {
            const weight = STAGE_WEIGHTS[client.pipelineStage] || 0;
            
            // For long-term forecasts (90 days), we include more top-funnel. 
            // For 7 days, we strictly only look at Bottom-Funnel (Issued/Underwriting)
            if (periodDays <= 7 && weight < 0.8) return acc;
            if (periodDays <= 30 && weight < 0.1) return acc;

            const clientPremium = client.policies.reduce((sum, p) => sum + p.premium, 0);
            
            // If no active policy yet, use estimated avg premium based on lead type
            let estimatedPremium = clientPremium;
            if (estimatedPremium === 0) {
                if (client.leadType === 'IUL') estimatedPremium = 6000;
                else if (client.leadType === 'FEX') estimatedPremium = 900;
                else estimatedPremium = 1500;
            }

            const settled = client.pipelineStage === PipelineStage.ISSUED ? estimatedPremium : 0;
            const weighted = client.pipelineStage !== PipelineStage.ISSUED ? (estimatedPremium * weight) : 0;

            return {
                settled: acc.settled + settled,
                weighted: acc.weighted + weighted
            };
        }, { settled: 0, weighted: 0 });
    };

    const d7Pipe = getWeightedValue(7);
    const d30Pipe = getWeightedValue(30);
    const d90Pipe = getWeightedValue(90);

    // 3. Construct the Forecast
    const generatePeriod = (label: string, days: number, pipe: { settled: number, weighted: number }): any => {
        // Velocity logic: The longer the period, the more "expected activity" matters
        const velocityProjected = avgDailyPremium * days * velocityFactor;
        
        // 7-day velocity is very low weight because we rely on current apps clearing
        const velocityWeight = days <= 7 ? 0.1 : days <= 30 ? 0.4 : 1.0;
        const velocityComponent = velocityProjected * velocityWeight;
        
        const total = pipe.settled + pipe.weighted + velocityComponent;

        // Determine Confidence
        let confidence: ConfidenceBand = 'MEDIUM';
        const hardDataRatio = (pipe.settled + (pipe.weighted * 0.8)) / total;
        
        if (hardDataRatio > 0.7) confidence = 'HIGH';
        else if (hardDataRatio < 0.35 || velocityFactor < 0.7) confidence = 'AT_RISK';

        return {
            label,
            days,
            projectedPremium: Math.round(total),
            confidence,
            composition: {
                settled: Math.round(pipe.settled),
                weighted: Math.round(pipe.weighted),
                velocity: Math.round(velocityComponent)
            }
        };
    };

    return {
        d7: generatePeriod('7-Day Outlook', 7, d7Pipe),
        d30: generatePeriod('30-Day Horizon', 30, d30Pipe),
        d90: generatePeriod('90-Day Trajectory', 90, d90Pipe)
    };
};
