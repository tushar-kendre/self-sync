import type { SQLiteDatabase } from 'expo-sqlite';
import type { JournalEntry } from '../types';

export class JournalService {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Create a new journal entry
   */
  async createEntry(data: Omit<JournalEntry, 'id' | 'wordCount' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const now = new Date().toISOString();
    const id = `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate word count
    const wordCount = data.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    const entry: JournalEntry = {
      id,
      date: data.date,
      title: data.title,
      content: data.content,
      mood: data.mood,
      tags: data.tags,
      isPrivate: data.isPrivate,
      wordCount,
      createdAt: now,
      updatedAt: now
    };

    await this.db.runAsync(`
      INSERT INTO journal_entries (
        id, date, title, content, mood, tags, is_private, word_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entry.id,
      entry.date,
      entry.title,
      entry.content,
      entry.mood,
      entry.tags,
      entry.isPrivate ? 1 : 0,
      entry.wordCount,
      entry.createdAt,
      entry.updatedAt
    ]);

    console.log('✅ Journal entry created:', entry.id);
    return entry;
  }

  /**
   * Update an existing journal entry
   */
  async updateEntry(id: string, data: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>): Promise<JournalEntry | null> {
    const now = new Date().toISOString();
    
    // Get the current entry first
    const current = await this.getEntryById(id);
    if (!current) {
      throw new Error(`Journal entry with id ${id} not found`);
    }

    // Calculate new word count if content is being updated
    let wordCount = current.wordCount;
    if (data.content !== undefined) {
      wordCount = data.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    const updatedEntry: JournalEntry = {
      ...current,
      ...data,
      wordCount,
      updatedAt: now
    };

    await this.db.runAsync(`
      UPDATE journal_entries 
      SET date = ?, title = ?, content = ?, mood = ?, tags = ?, 
          is_private = ?, word_count = ?, updated_at = ?
      WHERE id = ?
    `, [
      updatedEntry.date,
      updatedEntry.title,
      updatedEntry.content,
      updatedEntry.mood,
      updatedEntry.tags,
      updatedEntry.isPrivate ? 1 : 0,
      updatedEntry.wordCount,
      updatedEntry.updatedAt,
      id
    ]);

    console.log('✅ Journal entry updated:', id);
    return updatedEntry;
  }

  /**
   * Get a journal entry by ID
   */
  async getEntryById(id: string): Promise<JournalEntry | null> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT * FROM journal_entries WHERE id = ?
    `, [id]);

    if (!result) return null;

    return {
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  /**
   * Get journal entry for a specific date
   */
  async getEntryByDate(date: string): Promise<JournalEntry | null> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1
    `, [date]);

    if (!result) return null;

    return {
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  /**
   * Get recent journal entries
   */
  async getRecentEntries(limit: number = 20): Promise<JournalEntry[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);

    return results.map(result => ({
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }

  /**
   * Get journal entries for a date range
   */
  async getEntriesInRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC, created_at DESC
    `, [startDate, endDate]);

    return results.map(result => ({
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }

  /**
   * Search journal entries by content or title
   */
  async searchEntries(query: string, limit: number = 20): Promise<JournalEntry[]> {
    const searchTerm = `%${query}%`;
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      WHERE (content LIKE ? OR title LIKE ?)
      ORDER BY created_at DESC 
      LIMIT ?
    `, [searchTerm, searchTerm, limit]);

    return results.map(result => ({
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }

  /**
   * Get entries by mood rating
   */
  async getEntriesByMood(mood: number): Promise<JournalEntry[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      WHERE mood = ?
      ORDER BY created_at DESC
    `, [mood]);

    return results.map(result => ({
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }

  /**
   * Get journal statistics
   */
  async getJournalStats(days: number = 30): Promise<{
    totalEntries: number;
    totalWords: number;
    averageWordsPerEntry: number;
    averageMood: number;
    streakDays: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const stats = await this.db.getFirstAsync<any>(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(word_count) as total_words,
        AVG(word_count) as avg_words,
        AVG(mood) as avg_mood
      FROM journal_entries 
      WHERE date >= ?
    `, [startDateStr]);

    // Calculate streak (consecutive days with entries)
    const recentEntries = await this.db.getAllAsync<any>(`
      SELECT DISTINCT date FROM journal_entries 
      ORDER BY date DESC 
      LIMIT ?
    `, [days]);

    let streakDays = 0;
    if (recentEntries.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);
      
      for (const entry of recentEntries) {
        const entryDate = currentDate.toISOString().split('T')[0];
        if (entry.date === entryDate) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalEntries: stats?.total_entries || 0,
      totalWords: stats?.total_words || 0,
      averageWordsPerEntry: Math.round(stats?.avg_words || 0),
      averageMood: parseFloat((stats?.avg_mood || 0).toFixed(1)),
      streakDays
    };
  }

  /**
   * Delete a journal entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    const result = await this.db.runAsync(`
      DELETE FROM journal_entries WHERE id = ?
    `, [id]);

    const deleted = result.changes > 0;
    if (deleted) {
      console.log('✅ Journal entry deleted:', id);
    }
    return deleted;
  }

  /**
   * Get all unique tags used in journal entries
   */
  async getAllTags(): Promise<string[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT DISTINCT tags FROM journal_entries 
      WHERE tags IS NOT NULL AND tags != ''
    `);

    const allTags = new Set<string>();
    
    results.forEach(result => {
      if (result.tags) {
        try {
          const tags = JSON.parse(result.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => allTags.add(tag));
          }
        } catch (e) {
          // Handle malformed JSON gracefully
          console.warn('Failed to parse tags:', result.tags);
        }
      }
    });

    return Array.from(allTags).sort();
  }

  /**
   * Get entries by tag
   */
  async getEntriesByTag(tag: string): Promise<JournalEntry[]> {
    const results = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      WHERE tags LIKE ?
      ORDER BY created_at DESC
    `, [`%"${tag}"%`]);

    return results.map(result => ({
      id: result.id,
      date: result.date,
      title: result.title,
      content: result.content,
      mood: result.mood,
      tags: result.tags,
      isPrivate: result.is_private === 1,
      wordCount: result.word_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    }));
  }
}
