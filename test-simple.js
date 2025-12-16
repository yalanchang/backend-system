// 最简单测试，不用找phpMyAdmin
const mysql = require('mysql2/promise');

console.log('🚀 开始测试 Railway 连接...\n');

const config = {
  host: 'switchyard.proxy.rlwy.net',
  port: 55620,
  user: 'railway_app',
  password: 'Test123!',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
};

async function test() {
  try {
    console.log('🔗 尝试连接...');
    const conn = await mysql.createConnection(config);
    const [rows] = await conn.execute('SELECT 1 as ok');
    await conn.end();
    
    console.log('✅ 成功！连接正常！\n');
    console.log('🎯 请立即在 Vercel 设置这些环境变量：');
    console.log('DB_HOST=switchyard.proxy.rlwy.net');
    console.log('DB_PORT=55620');
    console.log('DB_USER=railway_app');
    console.log('DB_PASSWORD=Test123!');
    console.log('DB_NAME=railway');
    
    return true;
  } catch (error) {
    console.log('❌ 失败：' + error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n⚠️  用户或密码错误！');
      console.log('请改用 root 用户：');
      console.log('DB_USER=root');
      console.log('DB_PASSWORD=WFGP0XhUTS1kAshXfgYSWFCJ0gbCrBHY');
    }
    
    return false;
  }
}

test();
