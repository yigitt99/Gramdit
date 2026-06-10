import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'gramdit_user',
  password: process.env.DB_PASSWORD || 'gramdit_password',
  database: process.env.DB_DATABASE || 'gramdit',
  entities: [path.join(__dirname, '../**/*.entity.ts'), path.join(__dirname, '../**/*.entity.js')],
  migrations: [path.join(__dirname, '/migrations/*.ts'), path.join(__dirname, '/migrations/*.js')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
