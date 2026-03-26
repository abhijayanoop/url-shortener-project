import { ClickModel, IClickDocument } from "../models/click.model";

export interface CreateClickData {
  shortCode: string;
  timestamp: Date;
  hashedIp: string;
  referrer: string | null;
  userAgent: string | null;
}

export interface ClicksByDay {
  date: string; // "2024-03-15"
  count: number;
}

export interface TopEntry {
  value: string;
  count: number;
}

export class ClickRepository {
  async create(data: CreateClickData): Promise<IClickDocument> {
    return ClickModel.create(data);
  }

  async countByShortCode(shortCode: string): Promise<number> {
    return ClickModel.countDocuments({ shortCode: shortCode });
  }

  async getClicksByDay(
    shortCode: string,
    days: number,
  ): Promise<ClicksByDay[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await ClickModel.aggregate<{ date: string; count: number }>(
      [
        {
          $match: { shortCode, timestamp: { $gte: startDate } },
        },
        {
          $group: {
            _id: { $dateToString: "%Y-%m-%d", date: "$timeStamp" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ],
    );

    return results;
  }

  async topRefferers(shortCode: string, topN: number): Promise<TopEntry[]> {
    const result = await ClickModel.aggregate<{ value: string; count: number }>(
      [
        { $match: { shortCode: shortCode } },
        { $match: { referrer: { $ne: null } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: topN },
        { $project: { _id: 0, value: "$_id", count: 1 } },
      ],
    );

    return result;
  }

  async getTopUserAgents(shortCode: string, topN: number): Promise<TopEntry[]> {
    const result = await ClickModel.aggregate<{ value: string; count: number }>(
      [
        { $match: { shortCode: shortCode } },
        { $match: { userAgent: { $ne: null } } },
        { $group: { _id: "$userAgent", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: topN },
        { $project: { _id: 0, value: "$_id", count: 1 } },
      ],
    );

    return result;
  }
}
