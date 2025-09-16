// server/src/config/dependencies.ts

import { Pool } from 'pg';
import dbPool from './database';
import plaidClient from './plaid';
import { encrypt, decrypt } from '../utils/crypto';
import { RepositoryFactory } from '../repositories/repository.factory';
import { PlaidSyncService } from '../services/plaid-sync.service';
import { 
    LinkTokenCreateRequest, 
    LinkTokenCreateResponse,
    ItemPublicTokenExchangeRequest,
    ItemPublicTokenExchangeResponse,
    ItemGetRequest,
    ItemGetResponse,
    InstitutionsGetByIdRequest,
    InstitutionsGetByIdResponse
} from 'plaid';

/**
 * Centralized dependency injection container
 * This ensures all parts of the application use the same instances
 */
export class DependencyContainer {
    private static instance: DependencyContainer;
    
    private repositoryFactory: RepositoryFactory;
    private plaidSyncService: PlaidSyncService;

    private constructor(private pool: Pool) {
        this.repositoryFactory = new RepositoryFactory(pool);
        this.plaidSyncService = new PlaidSyncService();
    }

    static getInstance(): DependencyContainer {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer(dbPool);
        }
        return DependencyContainer.instance;
    }

    // Repository access
    getRepositoryFactory(): RepositoryFactory {
        return this.repositoryFactory;
    }

    getPlaidItemRepository() {
        return this.repositoryFactory.getPlaidItemRepository();
    }

    getBackgroundJobRepository() {
        return this.repositoryFactory.getBackgroundJobRepository();
    }

    getInstitutionRepository() {
        return this.repositoryFactory.getInstitutionRepository();
    }

    createUnitOfWork() {
        return this.repositoryFactory.createUnitOfWork();
    }

    // Services
    getPlaidSyncService(): PlaidSyncService {
        return this.plaidSyncService;
    }

    // Plaid client wrappers
    getPlaidClientWrappers() {
        return {
            linkTokenCreate: async (request: LinkTokenCreateRequest): Promise<LinkTokenCreateResponse> => {
                const response = await plaidClient.linkTokenCreate(request);
                return response.data;
            },
            itemPublicTokenExchange: async (request: ItemPublicTokenExchangeRequest): Promise<ItemPublicTokenExchangeResponse> => {
                const response = await plaidClient.itemPublicTokenExchange(request);
                return response.data;
            },
            itemGet: async (request: ItemGetRequest): Promise<ItemGetResponse> => {
                const response = await plaidClient.itemGet(request);
                return response.data;
            },
            institutionsGetById: async (request: InstitutionsGetByIdRequest): Promise<InstitutionsGetByIdResponse> => {
                const response = await plaidClient.institutionsGetById(request);
                return response.data;
            }
        };
    }

    // Utilities
    getCryptoUtils() {
        return { encrypt, decrypt };
    }
}
