import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export interface IUserOffer {
  id: string;
  user_id: string;
  offer_id: string;
  usage_count: number;
  last_used_at?: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateUserOffer {
  user_id: string;
  offer_id: string;
}

export class UserOffersModel extends BaseModel {
  protected tableName = "user_offers";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS user_offers (
      id CHAR(8) PRIMARY KEY,
      user_id CHAR(8) NOT NULL,
      offer_id CHAR(8) NOT NULL,
      usage_count INT DEFAULT 0,
      last_used_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_offer (user_id, offer_id),
      INDEX idx_user_offers_user (user_id),
      INDEX idx_user_offers_offer (offer_id),
      INDEX idx_user_offers_date (created_at),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createUserOffer(userOfferData: ICreateUserOffer): Promise<IUserOffer> {
    const id = await generateUniqueId(this);
    const userOffer = {
      id,
      ...userOfferData,
      usage_count: 0,
    };

    const columns = Object.keys(userOffer).join(", ");
    const placeholders = Object.keys(userOffer)
      .map(() => "?")
      .join(", ");
    const values = Object.values(userOffer);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByUserAndOffer(
    userId: string,
    offerId: string
  ): Promise<IUserOffer | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND offer_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [userId, offerId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByUserId(userId: string): Promise<IUserOffer[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    const results = await this.executeQuery(sql, [userId]);
    return Array.isArray(results) ? results : [];
  }

  async incrementUsage(id: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET usage_count = usage_count + 1,
          last_used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.executeQuery(sql, [id]);
  }

  async canUseOffer(
    userId: string,
    offerId: string,
    perUserLimit: number
  ): Promise<boolean> {
    const userOffer = await this.findByUserAndOffer(userId, offerId);
    if (!userOffer) return true;
    return userOffer.usage_count < perUserLimit;
  }
}

export const UserOffers = new UserOffersModel();
