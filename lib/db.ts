import mysql from 'mysql2/promise';

function getDbConfig() {
    if (process.env.DATABASE_URL) {
        try {
            const parsed = new URL(process.env.DATABASE_URL);
            return {
                host: parsed.hostname,
                port: parsed.port ? parseInt(parsed.port) : 3306,  
                user: parsed.username,
                password: parsed.password,
                database: parsed.pathname.replace(/^\//, ''),
                ssl: { rejectUnauthorized: false }
            };
        } catch (error) {
            console.error('解析 DATABASE_URL 失败:', error);
        }
    }
    // 开发环境
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),  
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'project_management',
        ssl: process.env.NODE_ENV === 'production' 
            ? { rejectUnauthorized: false } 
            : undefined
    };
}

const dbConfig = getDbConfig();
const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    idleTimeout: 60000,
    charset: 'utf8mb4',
});

export default pool;