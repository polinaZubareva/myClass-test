import * as dotenv from 'dotenv';

dotenv.config();

export const envDB = {
  DBPASSWORD: process.env.DB_PASSWORD,
  DBUSER: process.env.DB_USER,
  DBNAME: process.env.DB_NAME,
};
