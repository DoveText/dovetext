const pg = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
const localEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });
dotenv.config({ path: localEnvPath, override: true });

interface InvitationCodeInput {
  code: string;
  maxUses: number;
  platform?: string;
  description?: string;
}

async function createInvitationCode(input: InvitationCodeInput) {
  const client = new pg.Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'dovetext',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    await client.connect();

    const result = await client.query(`
      INSERT INTO invitation_codes (
        code,
        max_uses,
        platform,
        description,
        is_active,
        created_at
      )
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING *
    `, [
      input.code,
      input.maxUses,
      input.platform || null,
      input.description || null
    ]);

    console.log('Successfully created invitation code:', result.rows[0]);
  } catch (error) {
    console.error('Error creating invitation code:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const usage = `
Usage: npm run create:code -- <code> <maxUses> [platform] [description]
Example: npm run create:code -- BETA2024 50 twitter "Beta testing invitation"
`;

if (args.length < 1) {
  console.error('Error: Missing required arguments');
  console.log(usage);
  process.exit(1);
}

const [code, maxUses = "10", platform, ...descriptionParts] = args;
const description = descriptionParts.join(' ');

// Run if this file is executed directly
if (require.main === module) {
  createInvitationCode({
    code,
    maxUses: parseInt(maxUses, 10),
    platform,
    description: description || undefined
  });
}
