import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== 檢查環境變數 ===');
  
  // 列出所有環境變數
  const envVars = {};
  const relevantKeys = [
    'VERCEL', 'NODE_ENV', 
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'DATABASE_URL'
  ];
  
  for (const key of relevantKeys) {
    if (process.env[key]) {
      if (key.includes('PASSWORD') || key.includes('SECRET')) {
        envVars[key] = '***已設置***';
      } else if (key === 'DATABASE_URL') {
        envVars[key] = process.env[key].substring(0, 30) + '...';
      } else {
        envVars[key] = process.env[key];
      }
    } else {
      envVars[key] = '❌ 未設置';
    }
  }
  
  console.log('環境變數狀態:', envVars);
  
  return NextResponse.json({
    status: '環境變數檢查',
    timestamp: new Date().toISOString(),
    isVercel: process.env.VERCEL === '1',
    isProduction: process.env.NODE_ENV === 'production',
    environment_variables: envVars,
    analysis: envVars.DB_HOST === 'localhost' 
      ? '⚠️ 警告：DB_HOST 仍然是 localhost，請在 Vercel 環境變數中更改為 Railway 地址'
      : '✅ DB_HOST 看起來正確'
  });
}