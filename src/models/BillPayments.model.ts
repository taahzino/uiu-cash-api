import { generateUniqueId } from "../utilities/nanoid";
import { BaseModel } from "./BaseModel";

export enum BillPaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IBillPayment {
  id: string;
  transaction_id: string;
  biller_id: string;
  user_id: string;
  account_number: string;
  amount: number;
  fee: number;
  status: BillPaymentStatus;
  billing_month?: string | null;
  billing_year?: number | null;
  receipt_number?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ICreateBillPayment {
  transaction_id: string;
  biller_id: string;
  user_id: string;
  account_number: string;
  amount: number;
  fee: number;
  billing_month?: string | null;
  billing_year?: number | null;
}

export interface IUpdateBillPayment {
  status?: BillPaymentStatus;
  receipt_number?: string | null;
}

export class BillPaymentsModel extends BaseModel {
  protected tableName = "bill_payments";
  protected createTableSQL = `
    CREATE TABLE IF NOT EXISTS bill_payments (
      id CHAR(8) PRIMARY KEY,
      transaction_id CHAR(8) UNIQUE NOT NULL,
      biller_id CHAR(8) NOT NULL,
      user_id CHAR(8) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
      fee DECIMAL(15,2) DEFAULT 0.00,
      status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
      billing_month VARCHAR(20) NULL,
      billing_year INT NULL,
      receipt_number VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bill_payments_transaction (transaction_id),
      INDEX idx_bill_payments_biller (biller_id),
      INDEX idx_bill_payments_user (user_id),
      INDEX idx_bill_payments_status (status),
      INDEX idx_bill_payments_date (created_at),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (biller_id) REFERENCES billers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  private generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    return `RCP-${year}${month}-${random}`;
  }

  async createBillPayment(
    paymentData: ICreateBillPayment,
  ): Promise<IBillPayment> {
    const id = await generateUniqueId(this);
    const payment = {
      id,
      ...paymentData,
      status: BillPaymentStatus.PENDING,
      receipt_number: null,
    };

    const columns = Object.keys(payment).join(", ");
    const placeholders = Object.keys(payment)
      .map(() => "?")
      .join(", ");
    const values = Object.values(payment);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await this.executeQuery(sql, values);
    return await this.findById(id);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<IBillPayment | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE transaction_id = ? LIMIT 1`;
    const results = await this.executeQuery(sql, [transactionId]);
    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IBillPayment[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}
    `;
    const results = await this.executeQuery(sql, [userId]);
    return Array.isArray(results) ? results : [];
  }

  async findByBillerId(
    billerId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IBillPayment[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE biller_id = ?
      ORDER BY created_at DESC
      LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}
    `;
    const results = await this.executeQuery(sql, [billerId]);
    return Array.isArray(results) ? results : [];
  }

  async completePayment(
    id: string,
    connection?: any,
  ): Promise<IBillPayment | null> {
    const receipt_number = this.generateReceiptNumber();
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'COMPLETED',
          receipt_number = ?
      WHERE id = ?
    `;
    if (connection) {
      await connection.query(sql, [receipt_number, id]);
    } else {
      await this.executeQuery(sql, [receipt_number, id]);
    }
    return await this.findById(id);
  }

  async getTotalByBiller(
    billerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM ${this.tableName}
      WHERE biller_id = ? AND status = 'COMPLETED'
    `;
    const params: any[] = [billerId];

    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }

    const results = await this.executeQuery(sql, params);
    return results[0]?.total || 0;
  }
}

export const BillPayments = new BillPaymentsModel();
