import sqlite3
import os

def get_schema(db_path):
    if not os.path.exists(db_path):
        return f"Error: {db_path} not found"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        schema = {}
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table});")
            schema[table] = cursor.fetchall()
        conn.close()
        return schema
    except Exception as e:
        return str(e)

print("--- SETTINGS DB ---")
print(get_schema('settings.db'))
print("\n--- USER CONTENT DB ---")
print(get_schema('user_content.db'))
