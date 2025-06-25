import { v4 as uuidv4 } from 'uuid';
import pool from '../db/config';

interface DocumentVersion {
  id: string;
  subsidyId: string;
  version: number;
  content: any;
  changes: any[];
  userId: string;
  timestamp: number;
}

interface Conflict {
  id: string;
  subsidyId: string;
  baseVersion: number;
  conflictingChanges: ConflictingChange[];
  resolvedVersion?: number;
  resolution?: ConflictResolution;
  timestamp: number;
}

interface ConflictingChange {
  userId: string;
  version: number;
  changes: any;
  timestamp: number;
}

interface ConflictResolution {
  strategy: 'merge' | 'override' | 'manual';
  mergedChanges?: any;
  selectedVersion?: number;
  resolvedBy: string;
  timestamp: number;
}

export class ConflictResolutionService {
  private versions: Map<string, DocumentVersion[]> = new Map();
  private conflicts: Map<string, Conflict[]> = new Map();

  /**
   * Apply changes with automatic conflict detection
   */
  async applyChanges(
    subsidyId: string,
    userId: string,
    changes: any,
    baseVersion: number
  ): Promise<{ success: boolean; version?: number; conflict?: Conflict }> {
    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion(subsidyId);

      // Check for conflict
      if (currentVersion && currentVersion.version !== baseVersion) {
        // Conflict detected
        const conflict = await this.createConflict(
          subsidyId,
          baseVersion,
          [
            {
              userId: currentVersion.userId,
              version: currentVersion.version,
              changes: currentVersion.changes,
              timestamp: currentVersion.timestamp
            },
            {
              userId,
              version: baseVersion,
              changes,
              timestamp: Date.now()
            }
          ]
        );

        // Try automatic resolution
        const resolution = await this.attemptAutomaticResolution(conflict);
        
        if (resolution) {
          // Apply resolved changes
          const newVersion = await this.createVersion(
            subsidyId,
            userId,
            resolution.mergedChanges,
            currentVersion.version + 1
          );

          return { success: true, version: newVersion.version };
        } else {
          // Manual resolution needed
          return { success: false, conflict };
        }
      } else {
        // No conflict, apply changes
        const newVersion = await this.createVersion(
          subsidyId,
          userId,
          changes,
          baseVersion + 1
        );

        return { success: true, version: newVersion.version };
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      throw error;
    }
  }

  /**
   * Get current version of a document
   */
  private async getCurrentVersion(subsidyId: string): Promise<DocumentVersion | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM document_versions 
         WHERE subsidy_id = $1 
         ORDER BY version DESC 
         LIMIT 1`,
        [subsidyId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting current version:', error);
      return null;
    }
  }

  /**
   * Create a new version
   */
  private async createVersion(
    subsidyId: string,
    userId: string,
    changes: any,
    version: number
  ): Promise<DocumentVersion> {
    const newVersion: DocumentVersion = {
      id: uuidv4(),
      subsidyId,
      version,
      content: {}, // This would be computed from base + changes
      changes: Array.isArray(changes) ? changes : [changes],
      userId,
      timestamp: Date.now()
    };

    try {
      await pool.query(
        `INSERT INTO document_versions (id, subsidy_id, version, content, changes, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          newVersion.id,
          newVersion.subsidyId,
          newVersion.version,
          JSON.stringify(newVersion.content),
          JSON.stringify(newVersion.changes),
          newVersion.userId
        ]
      );

      // Update cache
      const versions = this.versions.get(subsidyId) || [];
      versions.push(newVersion);
      this.versions.set(subsidyId, versions);

      return newVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Create a conflict record
   */
  private async createConflict(
    subsidyId: string,
    baseVersion: number,
    conflictingChanges: ConflictingChange[]
  ): Promise<Conflict> {
    const conflict: Conflict = {
      id: uuidv4(),
      subsidyId,
      baseVersion,
      conflictingChanges,
      timestamp: Date.now()
    };

    try {
      await pool.query(
        `INSERT INTO document_conflicts (id, subsidy_id, base_version, conflicting_changes, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          conflict.id,
          conflict.subsidyId,
          conflict.baseVersion,
          JSON.stringify(conflict.conflictingChanges)
        ]
      );

      // Update cache
      const conflicts = this.conflicts.get(subsidyId) || [];
      conflicts.push(conflict);
      this.conflicts.set(subsidyId, conflicts);

      return conflict;
    } catch (error) {
      console.error('Error creating conflict:', error);
      throw error;
    }
  }

  /**
   * Attempt automatic conflict resolution
   */
  private async attemptAutomaticResolution(conflict: Conflict): Promise<ConflictResolution | null> {
    // Analyze changes for automatic resolution
    const changes1 = conflict.conflictingChanges[0].changes;
    const changes2 = conflict.conflictingChanges[1].changes;

    // Check if changes affect different sections
    if (this.canMergeAutomatically(changes1, changes2)) {
      // Merge changes
      const mergedChanges = this.mergeChanges(changes1, changes2);

      const resolution: ConflictResolution = {
        strategy: 'merge',
        mergedChanges,
        resolvedBy: 'system',
        timestamp: Date.now()
      };

      // Save resolution
      await this.saveResolution(conflict.id, resolution);

      return resolution;
    }

    // Check if one change is trivial (e.g., formatting only)
    if (this.isTrivialChange(changes1) && !this.isTrivialChange(changes2)) {
      return {
        strategy: 'override',
        selectedVersion: conflict.conflictingChanges[1].version,
        resolvedBy: 'system',
        timestamp: Date.now()
      };
    }

    // Manual resolution needed
    return null;
  }

  /**
   * Check if changes can be merged automatically
   */
  private canMergeAutomatically(changes1: any, changes2: any): boolean {
    // Simplified logic - check if changes affect different fields/sections
    if (typeof changes1 !== 'object' || typeof changes2 !== 'object') {
      return false;
    }

    const keys1 = Object.keys(changes1);
    const keys2 = Object.keys(changes2);

    // No overlapping keys = can merge
    const overlap = keys1.filter(key => keys2.includes(key));
    return overlap.length === 0;
  }

  /**
   * Merge non-conflicting changes
   */
  private mergeChanges(changes1: any, changes2: any): any {
    return {
      ...changes1,
      ...changes2,
      _merged: true,
      _mergedAt: Date.now()
    };
  }

  /**
   * Check if a change is trivial (e.g., formatting only)
   */
  private isTrivialChange(change: any): boolean {
    // Simplified logic - could be extended
    if (typeof change !== 'object') {
      return false;
    }

    const trivialKeys = ['formatting', 'style', 'metadata'];
    const changeKeys = Object.keys(change);

    return changeKeys.every(key => trivialKeys.includes(key));
  }

  /**
   * Save conflict resolution
   */
  private async saveResolution(conflictId: string, resolution: ConflictResolution): Promise<void> {
    try {
      await pool.query(
        `UPDATE document_conflicts 
         SET resolution = $1, resolved_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(resolution), conflictId]
      );
    } catch (error) {
      console.error('Error saving resolution:', error);
      throw error;
    }
  }

  /**
   * Manual conflict resolution
   */
  async resolveConflictManually(
    conflictId: string,
    userId: string,
    resolution: 'keep-mine' | 'keep-theirs' | 'merge',
    mergedContent?: any
  ): Promise<boolean> {
    try {
      const conflict = await this.getConflict(conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let finalResolution: ConflictResolution;

      switch (resolution) {
        case 'keep-mine':
          finalResolution = {
            strategy: 'override',
            selectedVersion: conflict.conflictingChanges[1].version,
            resolvedBy: userId,
            timestamp: Date.now()
          };
          break;

        case 'keep-theirs':
          finalResolution = {
            strategy: 'override',
            selectedVersion: conflict.conflictingChanges[0].version,
            resolvedBy: userId,
            timestamp: Date.now()
          };
          break;

        case 'merge':
          if (!mergedContent) {
            throw new Error('Merged content required for merge resolution');
          }
          finalResolution = {
            strategy: 'manual',
            mergedChanges: mergedContent,
            resolvedBy: userId,
            timestamp: Date.now()
          };
          break;
      }

      await this.saveResolution(conflictId, finalResolution);
      return true;
    } catch (error) {
      console.error('Error resolving conflict manually:', error);
      return false;
    }
  }

  /**
   * Get conflict by ID
   */
  private async getConflict(conflictId: string): Promise<Conflict | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM document_conflicts WHERE id = $1',
        [conflictId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting conflict:', error);
      return null;
    }
  }

  /**
   * Get version history for a document
   */
  async getVersionHistory(subsidyId: string, limit: number = 50): Promise<DocumentVersion[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM document_versions 
         WHERE subsidy_id = $1 
         ORDER BY version DESC 
         LIMIT $2`,
        [subsidyId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting version history:', error);
      return [];
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    subsidyId: string,
    targetVersion: number,
    userId: string
  ): Promise<boolean> {
    try {
      const targetVersionData = await pool.query(
        'SELECT * FROM document_versions WHERE subsidy_id = $1 AND version = $2',
        [subsidyId, targetVersion]
      );

      if (targetVersionData.rows.length === 0) {
        throw new Error('Target version not found');
      }

      const currentVersion = await this.getCurrentVersion(subsidyId);
      if (!currentVersion) {
        throw new Error('No current version found');
      }

      // Create a new version with rollback info
      await this.createVersion(
        subsidyId,
        userId,
        {
          type: 'rollback',
          fromVersion: currentVersion.version,
          toVersion: targetVersion,
          content: targetVersionData.rows[0].content
        },
        currentVersion.version + 1
      );

      return true;
    } catch (error) {
      console.error('Error rolling back version:', error);
      return false;
    }
  }
}