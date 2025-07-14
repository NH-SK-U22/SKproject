import sqlite3

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # 外部キー制約を有効にする
    c.execute('PRAGMA foreign_keys = ON')
    
    # students tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS students(
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT NOT NULL,
        name TEXT,
        number TEXT NOT NULL,
        class_id TEXT NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'teacher')),
        sum_point INTEGER DEFAULT 0,
        have_point INTEGER DEFAULT 0,
        camp_id INTEGER,
        theme_color TEXT,
        user_color TEXT,
        blacklist_point INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        UNIQUE(school_id, class_id, number, user_type)
    )''')
    
    # sticky tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS sticky(
        sticky_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        sticky_content TEXT NOT NULL,
        sticky_color TEXT NOT NULL,
        x_axis INTEGER DEFAULT 0,
        y_axis INTEGER DEFAULT 0,
        display_index INTEGER DEFAULT 0,
        feedback_A INTEGER DEFAULT 0,
        feedback_B INTEGER DEFAULT 0,
        feedback_C INTEGER DEFAULT 0,
        ai_summary_content TEXT,
        ai_teammate_avg_prediction REAL DEFAULT 0,
        ai_enemy_avg_prediction REAL DEFAULT 0,
        ai_overall_avg_prediction REAL DEFAULT 0,
        teammate_avg_score REAL DEFAULT 0,
        enemy_avg_score REAL DEFAULT 0,
        overall_avg_score REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        )''')
    
    # display_index字段のマイグレーション（既存のテーブルに字段を追加）
    try:
        c.execute('ALTER TABLE sticky ADD COLUMN display_index INTEGER DEFAULT 0')
        print("Added display_index column to sticky table")
    except sqlite3.OperationalError:
        # カラムが既に存在する場合はスキップする
        pass
    
    # message tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS message(
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        message_content TEXT NOT NULL,
        camp_id INTEGER NOT NULL,
        sticky_id INTEGER NOT NULL,
        feedback_A INTEGER DEFAULT 0,
        feedback_B INTEGER DEFAULT 0,
        feedback_C INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', '+9 hours')),
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (sticky_id) REFERENCES sticky(sticky_id)
        )''')
    
    
    # colorsets tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS colorsets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_number INTEGER NOT NULL,
        camp_type INTEGER NOT NULL,
        colors TEXT NOT NULL,
        UNIQUE(group_number, camp_type)
    )''')
    
    # teachers tableを作成
    # numberは教員番号
    c.execute('''CREATE TABLE IF NOT EXISTS teachers(
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        password TEXT NOT NULL,
        number TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'teacher')),
        UNIQUE(school_id,class_id,number,user_type)
    )''')
    
    # reward tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS reward(
        reward_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reward_content TEXT NOT NULL UNIQUE,
        need_point INTEGER NOT NULL,
        need_rank INTEGER NOT NULL,
        creater INTEGER NOT NULL,
        FOREIGN KEY(creater) REFERENCES teachers(teacher_id)
    )''')
    
    # holdReward tableを作成
    c.execute('''CREATE TABLE IF NOT EXISTS holdReward(
        hold_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        is_holding BOOLEAN NOT NULL,
        used_at TIMESTAMP NULL,
        FOREIGN KEY(student_id) REFERENCES students(id),
        FOREIGN KEY(reward_id) REFERENCES reward(reward_id)
    )''')
    
    # colorsetsデータの挿入
    colorsets_data = [
        (1, 1, '["#8097f9", "#6273f2", "#343be4", "#373acb", "#2f33a4"]'),  # 1 陣営1
        (1, 2, '["#faeada", "#f5d2b3", "#eeb483", "#e68c51", "#df6624"]'),  # 1 陣営2
        (2, 1, '["#6c84ff", "#4959ff", "#2929ff", "#211ee4", "#1a1aaf"]'),  # 2 陣営1
        (2, 2, '["#faeccb", "#f4d893", "#eec05b", "#eaa935", "#e38d24"]'),  # 2 陣営2
        (3, 1, '["#8b7bff", "#6646ff", "#5321ff", "#450ff2", "#3a0ccd"]'),  # 3 陣営1
        (3, 2, '["#effc8c", "#ecfa4a", "#eef619", "#e6e50c", "#d0bf08"]'),  # 3 陣営2
        (4, 1, '["#c3b5fd", "#a58bfa", "#885df5", "#783bec", "#6325cd"]'),  # 4 陣営1
        (4, 2, '["#fbfbea", "#f4f6d1", "#e8eda9", "#d7e076", "#bfcd41"]'),  # 4 陣営2
        (5, 1, '["#c76bff", "#b333ff", "#a10cff", "#8d00f3", "#6e04b6"]'),  # 5 陣営1
        (5, 2, '["#ffc472", "#fea039", "#fc8313", "#ed6809", "#cd510a"]'),  # 5 陣営2
        (6, 1, '["#ead5ff", "#dab5fd", "#c485fb", "#ad57f5", "#9025e6"]'),  # 6 陣営1
        (6, 2, '["#fdf9e9", "#fbf2c6", "#f8e290", "#f4ca50", "#efb121"]'),  # 6 陣営2
        (7, 1, '["#fad3fb", "#f6b1f3", "#ef83e9", "#e253da", "#ba30b0"]'),  # 7 陣営1
        (7, 2, '["#f8fbea", "#eef6d1", "#dceda9", "#c3df77", "#a0c937"]'),  # 7 陣営2
        (8, 1, '["#f8d2e9", "#f4add7", "#ec7aba", "#e1539e", "#c12d74"]'),  # 8 陣営1
        (8, 2, '["#dffcdc", "#c0f7bb", "#8fee87", "#56dd4b", "#2cb721"]'),  # 8 陣営2
        (9, 1, '["#f6d4e5", "#efb2cf", "#e482ae", "#d85c91", "#c43a6e"]'),  # 9 陣営1
        (9, 2, '["#cef9ef", "#9cf3e1", "#62e6cf", "#32cfb9", "#1bbfab"]'),  # 9 陣営2
        (10, 1, '["#fcd4cc", "#f9b5a8", "#f48975", "#e9634a", "#d74b31"]'), # 10 陣営1
        (10, 2, '["#cef9f0", "#9df2e0", "#64e4cf", "#35ccb8", "#1ec0ad"]'), # 10 陣営2
    ]
    
    # データが存在しない場合は挿入
    for group_num, camp_type, colors in colorsets_data:
        c.execute('INSERT OR IGNORE INTO colorsets (group_number, camp_type, colors) VALUES (?, ?, ?)',
                 (group_num, camp_type, colors))
    
    conn.commit()
    conn.close()
    