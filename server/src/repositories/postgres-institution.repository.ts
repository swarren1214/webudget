// server/src/repositories/postgres-institution.repository.ts

import { IInstitutionRepository } from './interfaces/institution.repository.interface';
import { 
  Institution, 
  CreateInstitutionRequest, 
  UpdateInstitutionRequest, 
  InstitutionQuery, 
  InstitutionListResponse,
  InstitutionRow 
} from '../types/institution';
import { DbConnection } from './interfaces/types';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * PostgreSQL implementation of the Institution repository
 * Follows the same patterns as PostgresPlaidItemRepository
 */
export class PostgresInstitutionRepository implements IInstitutionRepository {
  constructor(private db: DbConnection) {}

  async create(institutionData: CreateInstitutionRequest): Promise<Institution> {
    const id = uuidv4();
    
    const query = `
      INSERT INTO institutions (
        id,
        plaid_institution_id,
        name,
        logo_url,
        primary_color,
        url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      id,
      institutionData.plaid_institution_id,
      institutionData.name,
      institutionData.logo_url || null,
      institutionData.primary_color || null,
      institutionData.url || null,
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info('Created new institution', {
        id,
        plaid_institution_id: institutionData.plaid_institution_id,
        name: institutionData.name
      });
      
      return this.mapRowToInstitution(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        logger.error('Institution creation failed - duplicate plaid_institution_id', {
          plaid_institution_id: institutionData.plaid_institution_id,
          error: error.message
        });
        throw new Error(`Institution with plaid_institution_id '${institutionData.plaid_institution_id}' already exists`);
      }
      logger.error('Institution creation failed', {
        error: error.message,
        institutionData
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Institution | null> {
    const query = `
      SELECT * FROM institutions 
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] ? this.mapRowToInstitution(result.rows[0]) : null;
  }

  async findByPlaidId(plaidInstitutionId: string): Promise<Institution | null> {
    const query = `
      SELECT * FROM institutions 
      WHERE plaid_institution_id = $1
    `;

    const result = await this.db.query(query, [plaidInstitutionId]);
    return result.rows[0] ? this.mapRowToInstitution(result.rows[0]) : null;
  }

  async findMany(query: InstitutionQuery): Promise<InstitutionListResponse> {
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build WHERE clause dynamically
    if (query.plaid_institution_id) {
      whereClauses.push(`plaid_institution_id = $${paramCount++}`);
      values.push(query.plaid_institution_id);
    }

    if (query.name) {
      whereClauses.push(`name ILIKE $${paramCount++}`);
      values.push(`%${query.name}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM institutions ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Apply pagination
    const limit = Math.min(query.limit || 50, 200); // Max 200 per page
    const offset = query.offset || 0;

    const institutionsQuery = `
      SELECT * FROM institutions 
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    const institutionsResult = await this.db.query(institutionsQuery, [...values, limit, offset]);
    const institutions = institutionsResult.rows.map(row => this.mapRowToInstitution(row));

    return {
      institutions,
      total,
      count: institutions.length,
      offset
    };
  }

  async update(id: string, updateData: UpdateInstitutionRequest): Promise<Institution | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }

    if (updateData.logo_url !== undefined) {
      setClauses.push(`logo_url = $${paramCount++}`);
      values.push(updateData.logo_url);
    }

    if (updateData.primary_color !== undefined) {
      setClauses.push(`primary_color = $${paramCount++}`);
      values.push(updateData.primary_color);
    }

    if (updateData.url !== undefined) {
      setClauses.push(`url = $${paramCount++}`);
      values.push(updateData.url);
    }

    if (setClauses.length === 1) {
      // Only updated_at would be set, no actual changes
      return this.findById(id);
    }

    const query = `
      UPDATE institutions 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    values.push(id);

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Updated institution', { id, updateData });
    return this.mapRowToInstitution(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    // Check for dependent plaid_items first
    const dependencyQuery = `
      SELECT COUNT(*) as count FROM plaid_items 
      WHERE plaid_institution_id = (
        SELECT plaid_institution_id FROM institutions WHERE id = $1
      ) AND archived_at IS NULL
    `;
    
    const dependencyResult = await this.db.query(dependencyQuery, [id]);
    const dependentCount = parseInt(dependencyResult.rows[0].count);
    
    if (dependentCount > 0) {
      throw new Error(`Cannot delete institution: ${dependentCount} active plaid_items depend on it`);
    }

    const query = `DELETE FROM institutions WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      logger.info('Deleted institution', { id });
    }
    
    return deleted;
  }

  async existsByPlaidId(plaidInstitutionId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(SELECT 1 FROM institutions WHERE plaid_institution_id = $1)
    `;
    
    const result = await this.db.query(query, [plaidInstitutionId]);
    return result.rows[0].exists;
  }

  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as total FROM institutions`;
    const result = await this.db.query(query);
    return parseInt(result.rows[0].total);
  }

  async findOrCreate(plaidInstitutionId: string, institutionName: string): Promise<Institution> {
    // Try to find existing institution first
    const existing = await this.findByPlaidId(plaidInstitutionId);
    if (existing) {
      return existing;
    }

    // Create new institution if not found
    return this.create({
      plaid_institution_id: plaidInstitutionId,
      name: institutionName
    });
  }

  async createMany(institutions: CreateInstitutionRequest[]): Promise<Institution[]> {
    if (institutions.length === 0) {
      return [];
    }

    // Generate UUIDs for all institutions
    const institutionsWithIds = institutions.map(inst => ({
      id: uuidv4(),
      ...inst
    }));

    // Build multi-row insert query
    const valuesClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    institutionsWithIds.forEach((inst) => {
      valuesClauses.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
      values.push(
        inst.id,
        inst.plaid_institution_id,
        inst.name,
        inst.logo_url || null,
        inst.primary_color || null,
        inst.url || null
      );
    });

    const query = `
      INSERT INTO institutions (
        id, plaid_institution_id, name, logo_url, primary_color, url
      )
      VALUES ${valuesClauses.join(', ')}
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      logger.info('Bulk created institutions', { count: result.rows.length });
      return result.rows.map(row => this.mapRowToInstitution(row));
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        logger.error('Bulk institution creation failed - duplicate plaid_institution_id detected');
        throw new Error('One or more institutions already exist with the provided plaid_institution_id values');
      }
      throw error;
    }
  }

  /**
   * Convert database row to Institution entity
   * Handles type conversion from snake_case DB fields to camelCase API fields
   */
  private mapRowToInstitution(row: InstitutionRow): Institution {
    return {
      id: row.id,
      plaid_institution_id: row.plaid_institution_id,
      name: row.name,
      logo_url: row.logo_url || undefined,
      primary_color: row.primary_color || undefined,
      url: row.url || undefined,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
