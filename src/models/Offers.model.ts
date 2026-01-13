import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum OfferType {
  CASHBACK = "CASHBACK",
  DISCOUNT = "DISCOUNT",
  BONUS = "BONUS",
}

export enum OfferStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EXPIRED = "EXPIRED",
}

export interface IOffer {
  id: string;
  title: string;
  description?: string | null;
  offer_type: OfferType;
  offer_value: number;
  min_transaction_amount: number;
  max_discount_amount?: number | null;
  total_usage_limit?: number | null;
  per_user_limit: number;
  valid_from: Date | string;
  valid_until: Date | string;
  status: OfferStatus;
  terms_conditions?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateOffer {
  title: string;
  description?: string | null;
  offer_type: OfferType;
  offer_value: number;
  min_transaction_amount: number;
  max_discount_amount?: number | null;
  total_usage_limit?: number | null;
  per_user_limit?: number;
  valid_from: Date | string;
  valid_until: Date | string;
  terms_conditions?: string | null;
}

export interface IUpdateOffer {
  title?: string;
  description?: string | null;
  offer_value?: number;
  min_transaction_amount?: number;
  max_discount_amount?: number | null;
  total_usage_limit?: number | null;
  per_user_limit?: number;
  valid_from?: Date | string;
  valid_until?: Date | string;
  status?: OfferStatus;
  terms_conditions?: string | null;
}

export class OffersModel extends BaseModel {
  protected tableName = "offers";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS offers (
      id CHAR(8) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      offer_type ENUM('CASHBACK', 'DISCOUNT', 'BONUS') NOT NULL,
      offer_value DECIMAL(10,2) NOT NULL,
      min_transaction_amount DECIMAL(15,2) DEFAULT 0.00,
      max_discount_amount DECIMAL(15,2) NULL,
      total_usage_limit INT NULL,
      per_user_limit INT DEFAULT 1,
      valid_from TIMESTAMP NOT NULL,
      valid_until TIMESTAMP NOT NULL,
      status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
      terms_conditions TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_offers_status (status),
      INDEX idx_offers_type (offer_type),
      INDEX idx_offers_validity (valid_from, valid_until),
      INDEX idx_offers_date (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  async createOffer(offerData: ICreateOffer): Promise<IOffer> {
    const id = await generateUniqueId(this);
    const offer = {
      id,
      ...offerData,
      per_user_limit: offerData.per_user_limit || 1,
      status: OfferStatus.ACTIVE,
    };

    const columns = Object.keys(offer).join(", ");
    const placeholders = Object.keys(offer)
      .map(() => "?")
      .join(", ");
    const values = Object.values(offer);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findActiveOffers(): Promise<IOffer[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'ACTIVE'
        AND valid_from <= CURRENT_TIMESTAMP
        AND valid_until >= CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    const results = await this.executeQuery(sql);
    return Array.isArray(results) ? results : [];
  }

  async expireOldOffers(): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'EXPIRED'
      WHERE status = 'ACTIVE'
        AND valid_until < CURRENT_TIMESTAMP
    `;
    await this.executeQuery(sql);
  }

  async updateStatus(id: string, status: OfferStatus): Promise<IOffer | null> {
    return await this.updateById(id, { status });
  }
}

export const Offers = new OffersModel();
