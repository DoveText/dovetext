import { db } from './index';

export interface WaitlistEntry {
  id: number;
  email: string;
  status: 'join' | 'update' | 'processed';
  use_cases: string[];
  custom_case?: string;
  created_at: Date;
  processed_at?: Date;
}

export const WaitlistQueries = {
  // Check if email exists and get its latest status
  checkEmail: async (email: string): Promise<{ exists: boolean; lastStatus?: string }> => {
    const result = await db.oneOrNone<{ status: string }>(
      `SELECT status 
       FROM waitlist 
       WHERE email = $1 
       AND status IN ('join', 'update')  -- Only consider unprocessed records
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase()]
    );
    return {
      exists: result !== null,
      lastStatus: result?.status
    };
  },

  // Add new entry (either join or update)
  addEntry: async (entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'processed_at'>) => {
    return db.one<WaitlistEntry>(
      `INSERT INTO waitlist (email, status, use_cases, custom_case)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [entry.email.toLowerCase(), entry.status, entry.use_cases, entry.custom_case]
    );
  },

  // Get latest entry for email
  getLatestByEmail: async (email: string) => {
    return db.oneOrNone<WaitlistEntry>(
      'SELECT * FROM waitlist WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase()]
    );
  },

  // Mark specific entry as processed by ID
  markAsProcessed: async (id: number) => {
    return db.result(
      `UPDATE waitlist 
       SET status = 'processed', processed_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND status IN ('join', 'update')`,
      [id]
    );
  },

  // Get unprocessed entries
  getUnprocessedEntries: async () => {
    return db.manyOrNone<WaitlistEntry>(
      `SELECT * FROM waitlist 
       WHERE status IN ('join', 'update') 
       ORDER BY created_at ASC`
    );
  },

  // Get all entries for an email
  getEntriesByEmail: async (email: string) => {
    return db.manyOrNone<WaitlistEntry>(
      'SELECT * FROM waitlist WHERE email = $1 ORDER BY created_at DESC',
      [email.toLowerCase()]
    );
  }
};
