'use strict';

module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: false,
    },
    pool: { min: 2, max: 10 },
  },
});
