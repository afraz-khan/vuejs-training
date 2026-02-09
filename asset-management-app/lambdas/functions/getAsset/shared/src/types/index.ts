/**
 * Shared type definitions for Asset Management App
 */

import { Model, Optional } from 'sequelize'

// Asset category enum
export enum AssetCategory {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  OTHER = 'other',
}

// Asset attributes interface
export interface AssetAttributes {
  id: string
  ownerId: string
  name: string
  description: string | null
  category: AssetCategory
  imageKey: string | null
  createdAt: Date
  updatedAt: Date
}

// Asset creation attributes (fields that are optional during creation)
export interface AssetCreationAttributes
  extends Optional<AssetAttributes, 'id' | 'description' | 'imageKey' | 'createdAt' | 'updatedAt'> {}

// Asset instance type (Sequelize Model instance)
export interface AssetInstance
  extends Model<AssetAttributes, AssetCreationAttributes>,
    AssetAttributes {}

// Database configuration
export interface DatabaseConfig {
  dialect: 'mysql'
  host: string
  port: number
  database: string
  username: string
  password: string
  logging: boolean | ((sql: string) => void)
  pool: {
    max: number
    min: number
    acquire: number
    idle: number
  }
  dialectOptions?: {
    connectTimeout: number
  }
}

// Secrets Manager types
export interface DatabaseSecret {
  host: string
  port?: number
  dbname?: string
  database?: string
  username: string
  password: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Lambda event types
export interface AssetEvent {
  ownerId: string
  name: string
  description?: string
  category: AssetCategory
  imageKey?: string
}

export interface AssetUpdateEvent extends Partial<AssetEvent> {
  id: string
}