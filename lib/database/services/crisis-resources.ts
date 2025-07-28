import { SQLiteDatabase } from 'expo-sqlite';
import { CrisisResource } from '../types';

export class CrisisResourceService {
  constructor(private db: SQLiteDatabase) {}

  async getAllCrisisResources(): Promise<CrisisResource[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM crisis_resources 
      WHERE is_active = 1 
      ORDER BY priority ASC, name ASC
    `);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      contact: row.contact,
      description: row.description,
      isActive: row.is_active === 1,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getEmergencyResources(): Promise<CrisisResource[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM crisis_resources 
      WHERE is_active = 1 AND type IN ('emergency', 'hotline')
      ORDER BY priority ASC
    `);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      contact: row.contact,
      description: row.description,
      isActive: row.is_active === 1,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}
