import fetch from 'node-fetch';

async function runMigration() {
  try {
    console.log('Starting migration process...\n')
    
    const response = await fetch('http://localhost:3000/api/db-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'migration_token_2024'
      }
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✓ Migration successful!')
      console.log('\nStats:', JSON.stringify(result.stats, null, 2))
    } else {
      console.error('✗ Migration failed:', result.error)
      if (result.details) {
        console.error('Details:', result.details)
      }
    }
  } catch (error) {
    console.error('✗ Migration script error:', error.message)
  }
}

runMigration() 