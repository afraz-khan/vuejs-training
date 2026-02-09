import { AssetCategory } from '../types'

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate required string field
 */
export function validateRequired(value: any, fieldName: string): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value.trim()
}

/**
 * Validate optional string field
 */
export function validateOptionalString(value: any): string | null {
  if (!value) return null
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid string value')
  }
  return value.trim() || null
}

/**
 * Validate asset category
 */
export function validateCategory(value: any): AssetCategory {
  const validCategories = Object.values(AssetCategory)
  
  if (!value || typeof value !== 'string') {
    throw new ValidationError('Category is required', 'category')
  }
  
  const category = value.toLowerCase()
  if (!validCategories.includes(category as AssetCategory)) {
    throw new ValidationError(
      `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      'category'
    )
  }
  
  return category as AssetCategory
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): void {
  if (value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters`,
      fieldName
    )
  }
  if (value.length > max) {
    throw new ValidationError(
      `${fieldName} must not exceed ${max} characters`,
      fieldName
    )
  }
}