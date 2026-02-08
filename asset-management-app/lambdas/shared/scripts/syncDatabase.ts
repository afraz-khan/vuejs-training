// Import env FIRST to ensure environment variables are loaded
import '../src/config/env'
import { sequelize } from '../src/models'

async function syncDatabase(): Promise<void> {
  try {
    console.log('🔄 Syncing database...\n')

    // Test connection first
    await sequelize.authenticate()
    console.log('✅ Database connection successful\n')

    // Sync all models
    console.log('Creating tables...')
    await sequelize.sync({ alter: true })
    console.log('✅ Tables created/updated\n')

    // Show created tables
    const [results] = await sequelize.query('SHOW TABLES')
    console.log('📋 Tables in database:')
    results.forEach((row: any) => {
      console.log(`  - ${Object.values(row)[0]}`)
    })

    // Show Asset table structure
    console.log('\n📋 Assets table structure:')
    const [columns] = await sequelize.query('DESCRIBE Assets')
    console.table(columns)

    console.log('\n✨ Database sync complete!')
  } catch (error) {
    console.error('❌ Database sync failed:', error)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

// Run the sync
syncDatabase()