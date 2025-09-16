// server/src/repositories/postgres-institution.repository.test.ts

import { PostgresInstitutionRepository } from './postgres-institution.repository';
import { CreateInstitutionRequest } from '../types/institution';
import { PoolClient } from 'pg';

// Mock dependencies
jest.mock('../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('PostgresInstitutionRepository', () => {
  let repository: PostgresInstitutionRepository;
  let mockDb: jest.Mocked<PoolClient>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;
    repository = new PostgresInstitutionRepository(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createRequest: CreateInstitutionRequest = {
      plaid_institution_id: 'ins_test_123',
      name: 'Test Bank',
      logo_url: 'https://example.com/logo.png',
      primary_color: '#FF0000',
      url: 'https://testbank.com',
    };

    it('should create a new institution successfully', async () => {
      const mockDbRow = {
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF0000',
        url: 'https://testbank.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      // Mock the direct database query response
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.create(createRequest);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO institutions'),
        expect.arrayContaining([
          expect.any(String), // UUID
          'ins_test_123',
          'Test Bank',
          'https://example.com/logo.png',
          '#FF0000',
          'https://testbank.com',
        ])
      );

      expect(result).toEqual({
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF0000',
        url: 'https://testbank.com',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should handle optional fields as null', async () => {
      const minimalRequest: CreateInstitutionRequest = {
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
      };

      const mockDbRow = {
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: null,
        primary_color: null,
        url: null,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.create(minimalRequest);

      expect(result.logo_url).toBeUndefined();
      expect(result.primary_color).toBeUndefined();
      expect(result.url).toBeUndefined();
    });

    it('should throw error for duplicate plaid_institution_id', async () => {
      const dbError = new Error('Duplicate key value violates unique constraint');
      (dbError as any).code = '23505';

      (mockDb.query as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(repository.create(createRequest)).rejects.toThrow(
        "Institution with plaid_institution_id 'ins_test_123' already exists"
      );
    });
  });

  describe('findById', () => {
    it('should return institution when found', async () => {
      const mockDbRow = {
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF0000',
        url: 'https://testbank.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findById('uuid-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM institutions'),
        ['uuid-123']
      );

      expect(result).toEqual({
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF0000',
        url: 'https://testbank.com',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should return null when not found', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPlaidId', () => {
    it('should return institution when found', async () => {
      const mockDbRow = {
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: null,
        primary_color: null,
        url: null,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findByPlaidId('ins_test_123');

      expect(result?.plaid_institution_id).toBe('ins_test_123');
    });

    it('should return null when not found', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.findByPlaidId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('existsByPlaidId', () => {
    it('should return true when institution exists', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: true }] });

      const result = await repository.existsByPlaidId('ins_test_123');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS(SELECT 1 FROM institutions WHERE plaid_institution_id = $1)'),
        ['ins_test_123']
      );
    });

    it('should return false when institution does not exist', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [{ exists: false }] });

      const result = await repository.existsByPlaidId('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing institution if found', async () => {
      const mockDbRow = {
        id: 'uuid-123',
        plaid_institution_id: 'ins_test_123',
        name: 'Test Bank',
        logo_url: null,
        primary_color: null,
        url: null,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      // Mock findByPlaidId to return existing institution
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockDbRow] });

      const result = await repository.findOrCreate('ins_test_123', 'Test Bank');

      expect(result.plaid_institution_id).toBe('ins_test_123');
      expect(mockDb.query).toHaveBeenCalledTimes(1); // Only findByPlaidId call
    });

    it('should create new institution if not found', async () => {
      // Mock findByPlaidId to return null (not found)
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock create operation
      const mockCreatedRow = {
        id: 'uuid-456',
        plaid_institution_id: 'ins_new_123',
        name: 'New Bank',
        logo_url: null,
        primary_color: null,
        url: null,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreatedRow] });

      const result = await repository.findOrCreate('ins_new_123', 'New Bank');

      expect(result.plaid_institution_id).toBe('ins_new_123');
      expect(result.name).toBe('New Bank');
      expect(mockDb.query).toHaveBeenCalledTimes(2); // findByPlaidId + create
    });
  });
});
