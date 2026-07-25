import sqlite3
import json
import os

db_path = "/Users/diwakarsingh/.n8n/database.sqlite"
workflow_id = "kXOjCxljd1cgNPme"
target_chat_id = "@Marketbeconpro" # Fallback to username if ID is volatile

def update_workflow():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT nodes FROM workflow_entity WHERE id = ?;", (workflow_id,))
        row = cursor.fetchone()
        if not row:
            print(f"Workflow {workflow_id} not found")
            return
            
        nodes = json.loads(row[0])
        updated = False
        
        for node in nodes:
            if node.get("name") == "Telegram":
                node["parameters"]["chatId"] = target_chat_id
                updated = True
                print(f"Found and updated Telegram node to {target_chat_id}")
                
        if updated:
            cursor.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?;", (json.dumps(nodes), workflow_id))
            conn.commit()
            print("Successfully saved workflow update to n8n database.")
        else:
            print("Telegram node not found in workflow nodes.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_workflow()
