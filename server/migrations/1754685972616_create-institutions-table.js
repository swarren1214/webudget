/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Migration: Crconst down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('institutions', 'name', {
    ifExists: true,
    name: 'idx_institutions_name',
  });
  
  pgm.dropIndex('institutions', 'plaid_institution_id', {
    ifExists: true,
    name: 'idx_institutions_plaid_institution_id',
  });

  // Drop the table
  pgm.dropTable('institutions');
};

module.exports = { up, down };ns table
 * 
 * Purpose: Normalize institution data from plaid_items table to eliminate duplication
 * and establish proper relationships between institutions and plaid_items.
 * 
 * Safety: Creates table without foreign key constraints initially to allow safe
 * data migration. Constraints will be added in a follow-up migration after
 * data population.
 */

const shorthands = undefined;

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
const up = (pgm) => {
  // Create institutions table
  pgm.createTable('institutions', {
    id: {
      type: 'VARCHAR(255)',
      primaryKey: true,
      comment: 'UUID v4 identifier for the institution',
    },
    plaid_institution_id: {
      type: 'VARCHAR(255)',
      notNull: true,
      unique: true,
      comment: 'Plaid\'s unique identifier for this institution',
    },
    name: {
      type: 'VARCHAR(255)',
      notNull: true,
      comment: 'Human-readable name of the institution',
    },
    logo_url: {
      type: 'TEXT',
      comment: 'URL to institution\'s logo from Plaid',
    },
    primary_color: {
      type: 'VARCHAR(7)',
      comment: 'Primary color associated with the institution (hex format)',
    },
    url: {
      type: 'TEXT',
      comment: 'Institution\'s website URL',
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create indexes for performance
  pgm.createIndex('institutions', 'plaid_institution_id', {
    name: 'idx_institutions_plaid_institution_id',
  });
  
  pgm.createIndex('institutions', 'name', {
    name: 'idx_institutions_name',
  });

  // Add comment to table
  pgm.addConstraint('institutions', 'institutions_table_comment', {
    comment: 'Normalized institution data from Plaid API, referenced by plaid_items',
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
const down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('institutions', 'name', {
    ifExists: true,
    name: 'idx_institutions_name',
  });
  
  pgm.dropIndex('institutions', 'plaid_institution_id', {
    ifExists: true,
    name: 'idx_institutions_plaid_institution_id',
  });

  // Drop the table
  pgm.dropTable('institutions');
};

module.exports = { up, down };
