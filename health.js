"import { logger } from './logger.js'; export const healthCheck = () => { logger.info('Health check passed'); return { status: 'ok', timestamp: new Date().toISOString() }; };"  
