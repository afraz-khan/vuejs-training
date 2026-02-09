import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

const schema = a.schema({
  // Asset Tags - flexible tagging system
  AssetTag: a
    .model({
      assetId: a.string().required(),
      tagName: a.string().required(),
      tagValue: a.string(),
      createdBy: a.string(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Asset Status - track asset lifecycle
  AssetStatus: a
    .model({
      assetId: a.string().required(),
      status: a.enum(['active', 'archived', 'maintenance', 'deleted']),
      statusNote: a.string(),
      updatedBy: a.string(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Activity Log - audit trail
  ActivityLog: a
    .model({
      assetId: a.string().required(),
      action: a.enum(['created', 'viewed', 'updated', 'deleted']),
      performedBy: a.string(),
      details: a.string(),
      timestamp: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})