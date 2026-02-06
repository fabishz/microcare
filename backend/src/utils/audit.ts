import logger from './logger.js';

export enum AuditEventType {
    USER_REGISTERED = 'USER_REGISTERED',
    USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
    USER_LOGIN_FAILURE = 'USER_LOGIN_FAILURE',
    USER_LOGOUT = 'USER_LOGOUT',
    PASSWORD_CHANGE_SUCCESS = 'PASSWORD_CHANGE_SUCCESS',
    PASSWORD_CHANGE_FAILURE = 'PASSWORD_CHANGE_FAILURE',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
    ROLE_CHANGE = 'ROLE_CHANGE',
    SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
}

interface AuditData {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    resourceId?: string;
    action?: string;
    success: boolean;
    metadata?: Record<string, any>;
}

/**
 * Log an audit event
 */
export function logAuditEvent(type: AuditEventType, data: AuditData): void {
    const auditLog = {
        type: 'audit',
        eventType: type,
        ...data,
    };

    if (data.success) {
        logger.info(`Audit Event: ${type}`, auditLog);
    } else {
        logger.warn(`Audit Event (Failure): ${type}`, auditLog);
    }
}

export default logAuditEvent;
