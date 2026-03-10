# 專案管理系統 (Project Management System)

一個現代化的專案管理後台系統，使用 Next.js 15 + React + MySQL 構建。

## 功能特色

### 核心功能
- **專案管理** - 建立、編輯、刪除專案，追蹤進度
- **任務管理** - 看板式任務管理，支援拖拉排序
- **使用者管理** - 角色權限控制（管理員/經理/成員）
- **行事曆** - 視覺化時程管理，支援多種檢視模式
- **報表統計** - 圖表化數據分析

### 進階功能
- **通知系統** - 即時站內通知
- **全站搜尋** - 快速搜尋專案、任務、使用者（支援 Ctrl+K）
- **活動日誌** - 追蹤所有操作記錄

### 使用者體驗
- **多元登入** - 支援 Email/密碼 與 Google OAuth
- **響應式設計** - 支援桌面與行動裝置
- **現代化 UI** - 使用 Tailwind CSS 打造

## 技術棧

### 前端
- **框架**: Next.js 15 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖表**: Chart.js / react-chartjs-2
- **行事曆**: react-big-calendar
- **圖示**: react-icons

### 後端
- **API**: Next.js API Routes
- **認證**: NextAuth.js
- **資料庫**: MySQL 8
- **ORM**: mysql2

### 開發工具
- **套件管理**: npm
- **版本控制**: Git

## 本地開發

### 環境需求
- Node.js 18+
- MySQL 8.0+

### 安裝步驟

1. Clone 專案
```bash
git clone <repo-url>
cd backend-system
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數，建立 `.env.local`
```env
DATABASE_URL=mysql://user:password@localhost:3306/project_management
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. 建立資料庫並匯入 schema
```bash
mysql -u root -p < schema_clean.sql
```

5. 啟動開發伺服器
```bash
npm run dev
```

## 部署 (Vercel + Clever Cloud)

### 資料庫 - Clever Cloud MySQL

1. 在 [Clever Cloud](https://console.clever-cloud.com) 建立 MySQL add-on
2. 取得連線資訊（host、user、password、database）
3. 使用 TablePlus ，匯入 `schema_clean.sql`

### 應用程式 - Vercel

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 匯入專案
3. 設定以下環境變數：

| 變數名稱 | 說明 |
|---|---|
| `DATABASE_URL` | `mysql://user:password@host:3306/dbname` |
| `NEXTAUTH_URL` | 部署後的網址，例如 `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | 隨機字串，可用 `openssl rand -base64 32` 產生 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

4. 在 [Google Cloud Console](https://console.cloud.google.com) 的 OAuth 2.0 設定中，新增 Authorized redirect URI：
```
https://your-app.vercel.app/api/auth/callback/google
```

5. 部署完成後，Vercel 會自動在每次 push 到 main 分支時重新部署