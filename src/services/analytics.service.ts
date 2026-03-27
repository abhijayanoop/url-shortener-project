import {
  ClickRepository,
  ClicksByDay,
  TopEntry,
} from "../repositories/click.repository";
import { UrlService } from "./url.service";

export interface AnalyticsResponse {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  clicksByDay: ClicksByDay[];
  topReferrers: TopEntry[];
  topUserAgents: TopEntry[];
}

const DEFAULT_DAYS = 30;

const DEFAULT_TOP_N = 5;

export class AnalyticsService {
  constructor(
    private urlSvc: UrlService,
    private clickRepo: ClickRepository,
  ) {}

  async getAnalytics(
    shortCode: string,
    userId: string,
  ): Promise<AnalyticsResponse> {
    const url = await this.urlSvc.getByShortCode(shortCode, userId);

    const [totalClicks, clicksByDay, topReferrers, topUserAgents] =
      await Promise.all([
        this.clickRepo.countByShortCode(shortCode),
        this.clickRepo.getClicksByDay(shortCode, DEFAULT_DAYS),
        this.clickRepo.topRefferers(shortCode, DEFAULT_TOP_N),
        this.clickRepo.getTopUserAgents(shortCode, DEFAULT_TOP_N),
      ]);

    return {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      totalClicks,
      clicksByDay,
      topReferrers,
      topUserAgents,
    };
  }
}
