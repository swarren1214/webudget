/**
 * @param { import("node-pg-migrate").MigrationBuilder } pgm
 */
exports.up = (pgm) => {
  pgm.createTable('transfers', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    from_account_id: {
      type: 'integer',
      notNull: true,
      references: 'accounts(id)',
      onDelete: 'CASCADE',
    },
    to_account_id: {
      type: 'integer',
      notNull: true,
      references: 'accounts(id)',
      onDelete: 'CASCADE',
    },
    amount: {
      type: 'numeric(10, 2)',
      notNull: true,
    },
    date: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'completed',
    },
    note: {
      type: 'text',
    },
    plaid_transfer_id: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add indexes for better query performance
  pgm.createIndex('transfers', 'from_account_id');
  pgm.createIndex('transfers', 'to_account_id');
  pgm.createIndex('transfers', 'date');
};

/**
 * @param { import("node-pg-migrate").MigrationBuilder } pgm
 */
exports.down = (pgm) => {
  pgm.dropTable('transfers');
};
