// pages/api/connections/[id]/import.js
import { DatabaseClient } from '../../../../lib/database';
import { 
  getPingOneAccessToken,
  fetchPingOneUsers,
  fetchPingOneGroups,
  mapPingOneUser,
  mapPingOneGroup
} from '../../../../lib/services/pingone';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { 
    importUsers = true, 
    importGroups = true, 
    dryRun = false,
    limitUsers = null,
    limitGroups = null
  } = req.body;

  const db = new DatabaseClient();

  try {
    // Get connection details
    const result = await db.query('SELECT * FROM connections WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const connection = result.rows[0];
    if (connection.type !== 'PINGONE') {
      return res.status(400).json({ error: 'Only PingOne connections support import' });
    }

    const config = connection.connection_config;
    if (!config) {
      return res.status(400).json({ error: 'Connection configuration missing' });
    }

    // Update sync status to running
    if (!dryRun) {
      await db.query(`
        UPDATE connections 
        SET sync_status = 'running', last_sync_at = NOW() 
        WHERE id = $1
      `, [id]);
    }

    const importStats = {
      startTime: new Date().toISOString(),
      connectionId: id,
      dryRun,
      usersProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      usersSkipped: 0,
      groupsProcessed: 0,
      groupsCreated: 0,
      groupsUpdated: 0,
      groupsSkipped: 0,
      membershipsProcessed: 0,
      membershipsCreated: 0,
      errors: []
    };

    // Get PingOne access token
    const tokenResult = await getPingOneAccessToken(config);
    if (!tokenResult.success) {
      const errorMsg = `Authentication failed: ${tokenResult.error}`;
      importStats.errors.push(errorMsg);
      
      if (!dryRun) {
        await updateConnectionSyncStatus(db, id, 'error', importStats);
      }
      
      return res.status(400).json({ 
        success: false, 
        error: errorMsg,
        stats: importStats 
      });
    }

    const accessToken = tokenResult.accessToken;

    // Import Users
    if (importUsers) {
      console.log('Starting user import...');
      try {
        const users = await fetchPingOneUsers(config, accessToken, { 
          limit: limitUsers 
        });
        
        for (const pingOneUser of users) {
          try {
            importStats.usersProcessed++;
            
            if (dryRun) {
              console.log(`[DRY RUN] Would process user: ${pingOneUser.username || pingOneUser.email}`);
              importStats.usersCreated++; // Count as "would create" for dry run
              continue;
            }

            const userData = mapPingOneUser(pingOneUser);
            userData.sourceConnectionId = connection.id;

            // Check if user already exists
            const existingUser = await db.query(
              'SELECT id FROM users WHERE external_id = $1 AND source_connection_id = $2',
              [userData.externalId, connection.id]
            );

            if (existingUser.rows.length > 0) {
              // Update existing user
              await db.query(`
                UPDATE users SET 
                  username = $1, email = $2, first_name = $3, last_name = $4,
                  display_name = $5, phone_number = $6, mobile_number = $7,
                  title = $8, department = $9, employee_id = $10, 
                  employee_type = $11, is_enabled = $12, updated_at = NOW()
                WHERE id = $13
              `, [
                userData.username, userData.email, userData.firstName, userData.lastName,
                userData.displayName, userData.phoneNumber, userData.mobileNumber,
                userData.title, userData.department, userData.employeeId,
                userData.employeeType, userData.isEnabled, existingUser.rows[0].id
              ]);
              importStats.usersUpdated++;
            } else {
              // Create new user
              await db.createUser(userData);
              importStats.usersCreated++;
            }
          } catch (userError) {
            const errorMsg = `User ${pingOneUser.username || pingOneUser.email}: ${userError.message}`;
            console.error(errorMsg);
            importStats.errors.push(errorMsg);
            importStats.usersSkipped++;
          }
        }
      } catch (error) {
        const errorMsg = `Failed to fetch users: ${error.message}`;
        console.error(errorMsg);
        importStats.errors.push(errorMsg);
      }
    }

    // Import Groups
    if (importGroups) {
      console.log('Starting group import...');
      try {
        const groups = await fetchPingOneGroups(config, accessToken, {
          limit: limitGroups
        });
        
        for (const pingOneGroup of groups) {
          try {
            importStats.groupsProcessed++;
            
            if (dryRun) {
              console.log(`[DRY RUN] Would process group: ${pingOneGroup.name}`);
              importStats.groupsCreated++; // Count as "would create" for dry run
              continue;
            }

            const groupData = mapPingOneGroup(pingOneGroup);
            groupData.sourceConnectionId = connection.id;

            // Check if group already exists
            const existingGroup = await db.query(
              'SELECT id FROM groups WHERE external_id = $1 AND source_connection_id = $2',
              [groupData.externalId, connection.id]
            );

            let groupId;
            if (existingGroup.rows.length > 0) {
              // Update existing group
              await db.query(`
                UPDATE groups SET 
                  name = $1, display_name = $2, description = $3,
                  type = $4, scope = $5, is_enabled = $6, updated_at = NOW()
                WHERE id = $7
              `, [
                groupData.name, groupData.displayName, groupData.description,
                groupData.type, groupData.scope, groupData.isEnabled,
                existingGroup.rows[0].id
              ]);
              groupId = existingGroup.rows[0].id;
              importStats.groupsUpdated++;
            } else {
              // Create new group
              const newGroup = await db.query(`
                INSERT INTO groups (
                  name, display_name, description, type, scope, is_enabled,
                  source_connection_id, external_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING id
              `, [
                groupData.name, groupData.displayName, groupData.description,
                groupData.type, groupData.scope, groupData.isEnabled,
                connection.id, groupData.externalId
              ]);
              groupId = newGroup.rows[0].id;
              importStats.groupsCreated++;
            }

            // TODO: Import group memberships
            // This would require additional PingOne API calls to get group members
            
          } catch (groupError) {
            const errorMsg = `Group ${pingOneGroup.name}: ${groupError.message}`;
            console.error(errorMsg);
            importStats.errors.push(errorMsg);
            importStats.groupsSkipped++;
          }
        }
      } catch (error) {
        const errorMsg = `Failed to fetch groups: ${error.message}`;
        console.error(errorMsg);
        importStats.errors.push(errorMsg);
      }
    }

    // Calculate final statistics
    importStats.endTime = new Date().toISOString();
    importStats.duration = new Date(importStats.endTime) - new Date(importStats.startTime);

    // Update connection sync status
    if (!dryRun) {
      const finalStatus = importStats.errors.length > 0 ? 'completed_with_errors' : 'completed';
      await updateConnectionSyncStatus(db, id, finalStatus, importStats);
    }

    return res.status(200).json({
      success: true,
      message: `Import ${dryRun ? 'preview ' : ''}completed`,
      stats: importStats,
      dryRun
    });

  } catch (error) {
    console.error('Import error:', error);
    
    // Update error status if not dry run
    if (!dryRun) {
      const errorStats = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
      await updateConnectionSyncStatus(db, id, 'error', errorStats);
    }

    return res.status(500).json({ 
      success: false,
      error: 'Import failed', 
      details: error.message 
    });
  }
}

// Helper function to update connection sync status
async function updateConnectionSyncStatus(db, connectionId, status, stats) {
  try {
    await db.query(`
      UPDATE connections 
      SET sync_status = $1, import_stats = $2, updated_at = NOW()
      WHERE id = $3
    `, [status, JSON.stringify(stats), connectionId]);
  } catch (error) {
    console.error('Failed to update sync status:', error);
  }
}
    