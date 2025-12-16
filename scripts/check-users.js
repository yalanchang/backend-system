const mysql = require('mysql2/promise');

async function checkUsers() {
    const connection = await mysql.createConnection({
        host: 'switchyard.proxy.rlwy.net',
        port: 55620,
        user: 'root',
        password: 'WFGPOXhUTSlkAShXfqYSWFCJOgbCrBHY',
        database: 'railway'
    });

    try {
        const [users] = await connection.query('SELECT * FROM users');
        console.log('所有用戶:');
        console.table(users);
    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        await connection.end();
    }
}

checkUsers();