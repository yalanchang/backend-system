import mysql from 'mysql2/promise';
interface DbConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: false | { rejectUnauthorized: boolean };
}
function getDbConfig(): DbConfig {
    if (process.env.DATABASE_URL) {
        try {
            const parsed = new URL(process.env.DATABASE_URL);
            return {
                host: parsed.hostname,
                port: parsed.port ? parseInt(parsed.port) : 3306,
                user: parsed.username,
                password: parsed.password,
                database: parsed.pathname.replace(/^\//, ''),
                ssl: false
            };
        } catch (error) {
            console.error('解析 DATABASE_URL 失败:', error);
        }
    }
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



export async function query<T>(sql: string, params?: any[]): Promise<[T, any]> {
    const { ssl, ...config } = getDbConfig();
    const connConfig = {
        ...config,
        ...(ssl !== false && ssl ? { ssl } : {}),
    };
    const conn = await mysql.createConnection(connConfig);
    try {
        const result = await conn.query(sql, params);
        return result as [T, any];
    } finally {
        await conn.end();
    }
}

// 保留 pool （本地開發）
const dbConfig = getDbConfig();
const { ssl, ...configWithoutSsl } = dbConfig;

const pool = mysql.createPool({
    ...configWithoutSsl,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    connectTimeout: 10000,
    ...(ssl !== false && ssl ? { ssl } : {}),
});

export default pool;