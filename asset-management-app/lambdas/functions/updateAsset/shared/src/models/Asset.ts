import { DataTypes, Sequelize, ModelStatic } from 'sequelize'
import type { AssetInstance, AssetCategory } from '../types'

/**
 * Define Asset Model
 * Represents an asset uploaded by a user
 */
export function defineAssetModel(sequelize: Sequelize): ModelStatic<AssetInstance> {
  const Asset = sequelize.define<AssetInstance>(
    'Asset',
    {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the asset',
      },

      // Owner Information
      ownerId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Cognito user ID of the asset owner',
        validate: {
          notEmpty: {
            msg: 'Owner ID cannot be empty',
          },
          len: {
            args: [1, 255],
            msg: 'Owner ID must be between 1 and 255 characters',
          },
        },
      },

      // Asset Details
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Name of the asset',
        validate: {
          notEmpty: {
            msg: 'Asset name cannot be empty',
          },
          len: {
            args: [1, 255],
            msg: 'Asset name must be between 1 and 255 characters',
          },
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the asset',
        validate: {
          len: {
            args: [0, 65535],
            msg: 'Description is too long',
          },
        },
      },

      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Category of the asset',
        validate: {
          notEmpty: {
            msg: 'Category cannot be empty',
          },
          isIn: {
            args: [['image', 'document', 'video', 'other']],
            msg: 'Category must be one of: image, document, video, other',
          },
        },
      },

      // Image Information
      imageKey: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'S3 object key for the asset image',
        validate: {
          len: {
            args: [0, 500],
            msg: 'Image key is too long',
          },
        },
      },
    } as any, // Type assertion to avoid timestamp field requirement
    {
      // Model options
      tableName: 'Assets',
      timestamps: true, // Automatically adds createdAt and updatedAt
      underscored: false,
      indexes: [
        {
          name: 'idx_ownerId',
          fields: ['ownerId'],
        },
        {
          name: 'idx_category',
          fields: ['category'],
        },
        {
          name: 'idx_createdAt',
          fields: ['createdAt'],
        },
      ],
      comment: 'Stores metadata for user-uploaded assets',
    }
  )

  return Asset
}

/**
 * Asset Model Type
 */
export type AssetModel = ModelStatic<AssetInstance>