// lib/import-tasks.js
import { DatabaseClient } from './database';

export async function createImportTask(taskData) {
  const db = new DatabaseClient();
  
  const result = await db.query(`
    INSERT INTO import_tasks (
      connection_id, task_type, status, import_config, created_at
    ) VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `, [
    taskData.connectionId,
    taskData.taskType,
    taskData.status,
    JSON.stringify(taskData.importConfig)
  ]);

  return result.rows[0].id;
}

export async function updateImportTask(taskId, updates) {
  const db = new DatabaseClient();
  
  const setPairs = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    setPairs.push(`${key} = $${paramIndex}`);
    values.push(updates[key]);
    paramIndex++;
  });

  values.push(taskId);

  const query = `
    UPDATE import_tasks 
    SET ${setPairs.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
  `;

  await db.query(query, values);
}