import sqlite3
import os

def view_table(cursor, table_name):
    print(f"\n=== {table_name} Table ===")
    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [column[1] for column in cursor.fetchall()]
    print("Columns:", ", ".join(columns))
    
    # Get all rows
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    print("\nData:")
    for row in rows:
        print(row)

def main():
    db_path = os.path.join(os.path.dirname(__file__), 'payroll.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    if not tables:
        print("No tables found in the database.")
        return
        
    print("Available tables:", ", ".join(table[0] for table in tables))
    
    # View each table
    for table in tables:
        view_table(cursor, table[0])
    
    conn.close()

if __name__ == "__main__":
    main()
