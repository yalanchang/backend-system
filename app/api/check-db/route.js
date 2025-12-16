import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  console.log('=== 数据库检查开始 ===');
  
  // 环境检测
  const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  console.log('环境信息:', {
    isVercel,
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST,
    hasDATABASE_URL: !!process.env.DATABASE_URL
  });

  // 数据库配置
  let dbConfig;
  if (isVercel) {
    // 生产环境 - Vercel + Railway
    console.log('🟢 检测到生产环境，使用 Railway 数据库');
    
    // 方法1: 使用 DATABASE_URL
    if (process.env.DATABASE_URL) {
      console.log('使用 DATABASE_URL 连接');
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          user: url.username,
          password: url.password,
          database: url.pathname.replace(/^\//, ''),
          ssl: { rejectUnauthorized: false }
        };
      } catch (error) {
        console.error('DATABASE_URL 解析失败:', error.message);
      }
    }
    
    // 方法2: 使用分开的环境变量
    if (!dbConfig) {
      console.log('使用分开的环境变量连接');
      dbConfig = {
        host: process.env.DB_HOST || 'mysql.railway.internal',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'avnadmin',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'railway',
        ssl: { rejectUnauthorized: false }
      };
    }
  } else {
    // 开发环境
    console.log('🟡 开发环境，使用本地数据库');
    dbConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'project_management',
      ssl: undefined
    };
  }

  console.log('数据库配置:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user
  });

  try {
    // 测试连接
    console.log('尝试连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    await connection.end();
    
    console.log('✅ 数据库连接成功');
    return NextResponse.json({
      success: true,
      message: '数据库连接成功！',
      data: {
        current_time: rows[0].current_time,
        test_query: 'SELECT NOW()'
      },
      environment: isVercel ? 'Vercel 生产环境' : '本地开发环境',
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
      },
      envInfo: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        hasDB_HOST: !!process.env.DB_HOST,
        hasDATABASE_URL: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      environment: isVercel ? 'Vercel 生产环境' : '本地开发环境',
      config: dbConfig,
      suggestion: isVercel 
        ? '请在 Vercel 环境变量中添加 DB_HOST 或 DATABASE_URL' 
        : '请确保本地 MySQL 服务已启动',
      troubleshooting: [
        '1. 检查 Vercel 环境变量是否正确设置',
        '2. 检查 Railway 数据库是否运行',
        '3. 检查网络连接'
      ]
    }, { status: 500 });
  }
}