import pkg from 'pg';
import { envDB } from '../../constants.js';

const { Pool } = pkg;

const dbPool = new Pool({
  user: envDB.DBUSER,
  password: envDB.DBPASSWORD,
  host: 'localhost',
  port: 5432,
  database: envDB.DBNAME,
});

export default dbPool;
