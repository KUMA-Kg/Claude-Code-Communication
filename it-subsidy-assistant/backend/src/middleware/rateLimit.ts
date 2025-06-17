import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { supabaseService } from '@/config/database';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';

const createRateLimitStore = () => {
  const store = new Map();
  
  return {
    incr: async (key: string): Promise<{ totalHits: number; timeWhenKeyExpires?: Date }> => {
      const now = Date.now();
      const windowStart = Math.floor(now / env.RATE_LIMIT_WINDOW_MS) * env.RATE_LIMIT_WINDOW_MS;
      const storeKey = `${key}:${windowStart}`;
      
      const current = store.get(storeKey) || 0;
      const newCount = current + 1;
      store.set(storeKey, newCount);
      
      setTimeout(() => {
        store.delete(storeKey);
      }, env.RATE_LIMIT_WINDOW_MS);
      
      return {
        totalHits: newCount,
        timeWhenKeyExpires: new Date(windowStart + env.RATE_LIMIT_WINDOW_MS)
      };
    },
    
    decrement: async (key: string): Promise<void> => {
      const now = Date.now();
      const windowStart = Math.floor(now / env.RATE_LIMIT_WINDOW_MS) * env.RATE_LIMIT_WINDOW_MS;
      const storeKey = `${key}:${windowStart}`;
      
      const current = store.get(storeKey) || 0;
      if (current > 0) {
        store.set(storeKey, current - 1);
      }
    },
    
    resetKey: async (key: string): Promise<void> => {
      const keysToDelete = Array.from(store.keys()).filter(k => k.startsWith(key));
      keysToDelete.forEach(k => store.delete(k));
    }
  };
};

const customStore = createRateLimitStore();

export const rateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: customStore,
  keyGenerator: (req: Request): string => {
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  }
});

export const createApiSpecificRateLimit = (maxRequests: number, windowMs: number = env.RATE_LIMIT_WINDOW_MS) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests to this endpoint. Limit: ${maxRequests} per ${windowMs / 1000 / 60} minutes.`
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      const user = (req as any).user;
      return user ? `user:${user.id}` : `ip:${req.ip}`;
    },
    handler: (req: Request, res: Response) => {
      const user = (req as any).user;
      const identifier = user ? `user:${user.id}` : `IP:${req.ip}`;
      
      logger.warn(`API rate limit exceeded for ${identifier}`, {
        identifier,
        endpoint: req.path,
        method: req.method,
        maxRequests,
        windowMs
      });
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests to this endpoint. Limit: ${maxRequests} per ${windowMs / 1000 / 60} minutes.`
        }
      });
    }
  });
};

export const searchRateLimit = createApiSpecificRateLimit(100, 60000); // 100 requests per minute
export const documentGenerationRateLimit = createApiSpecificRateLimit(10, 3600000); // 10 requests per hour

export const logRateLimit = async (req: Request, endpoint: string): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) return;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - (windowStart.getMinutes() % 60), 0, 0);

    await supabaseService
      .from('rate_limits')
      .upsert({
        user_id: user.id,
        endpoint,
        request_count: 1,
        window_start: windowStart.toISOString()
      }, {
        onConflict: 'user_id,endpoint,window_start',
        ignoreDuplicates: false
      });

  } catch (error) {
    logger.error('Failed to log rate limit:', error);
  }
};

export const getRateLimitStatus = async (userId: string, endpoint: string): Promise<{
  requests: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}> => {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - (windowStart.getMinutes() % 60), 0, 0);

    const { data, error } = await supabaseService
      .from('rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('window_start', windowStart.toISOString())
      .single();

    const requests = data?.request_count || 0;
    const limit = endpoint.includes('search') ? 100 : 
                 endpoint.includes('document') ? 10 : 
                 env.RATE_LIMIT_MAX_REQUESTS;

    const resetTime = new Date(windowStart);
    resetTime.setHours(resetTime.getHours() + 1);

    return {
      requests,
      limit,
      remaining: Math.max(0, limit - requests),
      resetTime
    };

  } catch (error) {
    logger.error('Failed to get rate limit status:', error);
    return {
      requests: 0,
      limit: env.RATE_LIMIT_MAX_REQUESTS,
      remaining: env.RATE_LIMIT_MAX_REQUESTS,
      resetTime: new Date(Date.now() + env.RATE_LIMIT_WINDOW_MS)
    };
  }
};