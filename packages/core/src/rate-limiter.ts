export interface RateLimitStatus {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyResetAt: Date;
  monthlyResetAt: Date;
}

export class RateLimiter {
  private dailyUsed = 0;
  private monthlyUsed = 0;
  private dailyResetAt: Date;
  private monthlyResetAt: Date;

  constructor(
    private readonly dailyLimit = 1000,
    private readonly monthlyLimit = 20000,
  ) {
    this.dailyResetAt = this.getNextDayReset();
    this.monthlyResetAt = this.getNextMonthReset();
  }

  recordCall(): void {
    this.resetIfNeeded();
    this.dailyUsed++;
    this.monthlyUsed++;
  }

  canMakeCall(): boolean {
    this.resetIfNeeded();
    return this.dailyUsed < this.dailyLimit && this.monthlyUsed < this.monthlyLimit;
  }

  getStatus(): RateLimitStatus {
    this.resetIfNeeded();
    return {
      dailyUsed: this.dailyUsed,
      dailyLimit: this.dailyLimit,
      monthlyUsed: this.monthlyUsed,
      monthlyLimit: this.monthlyLimit,
      dailyResetAt: this.dailyResetAt,
      monthlyResetAt: this.monthlyResetAt,
    };
  }

  private resetIfNeeded(): void {
    const now = new Date();
    if (now >= this.dailyResetAt) {
      this.dailyUsed = 0;
      this.dailyResetAt = this.getNextDayReset();
    }
    if (now >= this.monthlyResetAt) {
      this.monthlyUsed = 0;
      this.monthlyResetAt = this.getNextMonthReset();
    }
  }

  private getNextDayReset(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getNextMonthReset(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
