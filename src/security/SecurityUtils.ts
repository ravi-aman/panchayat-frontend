// Security utilities for chat system
export class SecurityUtils {
  // Sanitize log inputs to prevent log injection
  static sanitizeForLog(input: any): string {
    if (typeof input !== 'string') {
      input = String(input);
    }
    return input
      .replace(/[\r\n]/g, '_')
      .replace(/[\t]/g, ' ')
      .substring(0, 100); // Limit length
  }

  // Validate and sanitize message content
  static validateMessage(content: string): { isValid: boolean; sanitized: string } {
    if (!content || typeof content !== 'string') {
      return { isValid: false, sanitized: '' };
    }

    const sanitized = content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .substring(0, 1000); // Limit message length

    return {
      isValid: sanitized.length > 0 && sanitized.length <= 1000,
      sanitized,
    };
  }

  // Validate user/chat IDs
  static validateId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{1,50}$/.test(id);
  }

  // Rate limiting tracker
  private static rateLimits = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimits.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userLimit.count >= maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }
}
