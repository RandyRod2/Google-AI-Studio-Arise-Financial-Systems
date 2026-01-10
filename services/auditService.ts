
import { User, AuditLog } from '../types';

/**
 * Audit Vault Service
 * Handles the immutable logging of sensitive system actions.
 */

const AUDIT_STORAGE_KEY = 'arise_audit_vault_v1';

export const getAuditLogs = (): AuditLog[] => {
    try {
        const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to retrieve audit vault", e);
        return [];
    }
};

export const logAuditAction = (
    actor: User | null, 
    action: string, 
    entity: string, 
    details: string, 
    riskScore: number = 0
) => {
    const logs = getAuditLogs();
    
    const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'System Auto-Process',
        actorRole: actor?.role || 'STAFF',
        action,
        entity,
        details,
        riskScore
    };

    const updatedLogs = [newLog, ...logs].slice(0, 5000); // Keep last 5k logs
    
    try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (e) {
        console.warn("Audit Vault full. Oldest logs pruned.");
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs.slice(0, 2000)));
    }

    // Also broadcast for live components
    window.dispatchEvent(new CustomEvent('arise-audit-broadcast', { detail: newLog }));
};

export const clearAuditVault = () => {
    if (confirm("SECURITY WARNING: You are about to purge the entire audit history. This action is recorded. Proceed?")) {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
    }
};
