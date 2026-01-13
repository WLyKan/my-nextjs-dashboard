# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
永远使用中文回答。

## 开发命令

- 安装依赖：`pnpm install`
- 本地开发（使用 Turbopack）：`pnpm dev`
- 构建生产版本：`pnpm build`
- 启动生产服务器：`pnpm start`
- 代码检查：`pnpm lint`
- 自动修复代码问题：`pnpm lint:fix`

**注意**：使用 pnpm 作为包管理器。项目默认启用 Turbopack 进行开发。

## 高层架构

### 技术栈
- **框架**：Next.js (App Router) - 使用 `app/` 目录结构，默认为服务端组件
- **数据库**：PostgreSQL，通过 `postgres` npm 包访问，需要环境变量 `POSTGRES_URL`
- **认证**：NextAuth.js v5 (beta) - 使用 Credentials Provider
- **样式**：Tailwind CSS + @tailwindcss/forms
- **表单验证**：Zod
- **包管理器**：pnpm

### 目录结构

```
app/
├── lib/              # 数据访问层和业务逻辑
│   ├── definitions.ts    # 类型定义（数据模型）
│   ├── data.ts           # 数据库查询函数
│   ├── actions.ts        # Server Actions（表单提交、认证等）
│   └── utils.ts          # 工具函数（格式化等）
├── ui/              # UI 组件
│   ├── dashboard/        # 仪表盘相关组件
│   ├── invoices/         # 发票相关组件
│   └── customers/        # 客户相关组件
├── dashboard/       # 仪表盘路由页面
├── login/           # 登录页面
└── layout.tsx       # 根布局
auth.ts             # NextAuth 配置
auth.config.ts      # NextAuth 配置对象
proxy.ts            # NextAuth 中间件导出（保护路由）
```

### 认证流程

认证系统使用 NextAuth.js v5 的 Credentials Provider：

1. **配置文件**：
   - `auth.config.ts`：定义认证配置，包括受保护路由逻辑和登录页面路径
   - `auth.ts`：导出 `auth`、`signIn`、`signOut` 实例
   - `proxy.ts`：中间件导出，保护 `/dashboard` 路由

2. **路由保护**：
   - 未认证用户访问 `/dashboard` 会被重定向到 `/login`
   - 已认证用户访问 `/login` 会被重定向到 `/dashboard`
   - 通过 `authorized` 回调实现（auth.config.ts:8-19）

3. **认证实现**：
   - 用户密码使用 `bcrypt` 加密存储
   - `getUser` 函数从数据库查询用户（auth.ts:11-19）
   - `authenticate` Server Action 处理登录表单提交（app/lib/actions.ts:122-137）

### 数据层设计

**数据存储**：
- 金额在数据库中以**美分**（cents）存储，显示时通过 `formatCurrency` 转换为美元
- 数据库查询使用 `postgres` 包的**标签模板**语法（tagged template literals）

**核心文件**：
- `app/lib/definitions.ts`：所有数据类型的单一真实来源
- `app/lib/data.ts`：所有数据库查询函数
- `app/lib/actions.ts`：Server Actions（使用 `'use server'` 指令）

**错误处理模式**（在 data.ts 中保持一致）：
```typescript
try {
  // 数据库操作
} catch (error) {
  console.error('Database Error:', error);
  throw new Error('Failed to ...');
}
```

**Server Actions 模式**（在 actions.ts 中保持一致）：
```typescript
try {
  // 数据库操作
} catch (error) {
  console.error(error);
  return { message: 'Database Error: Failed to ...' };
}
revalidatePath('/dashboard/invoices');
redirect('/dashboard/invoices');
```

### App Router 约定

- `page.tsx`：路由的入口页面
- `layout.tsx`：当前路由的共享布局
- `loading.tsx`：加载状态（支持 React Suspense）
- `error.tsx`：错误边界
- `not-found.tsx`：404 页面

**路由组**：使用 `(name)` 语法创建不影响 URL 的路由分组（如 `app/dashboard/(overview)/page.tsx`）

### 组件模式

- **服务端组件**：默认，用于数据获取和服务器端逻辑
- **客户端组件**：使用 `'use client'` 指令，用于交互式功能
- **UI 组件**：位于 `app/ui/`，按功能分组（dashboard、invoices、customers）

### TypeScript 配置

- 路径别名：`@/*` 映射到项目根目录
- 严格模式已启用
- 使用 Next.js 插件进行类型检查

### 样式系统

- Tailwind CSS 工具类直接在组件中使用
- 颜色主题：自定义蓝色方案（blue-400/500/600）
- 使用 `clsx` 进行条件类名组合
- Shimmer 动画用于骨架屏加载状态

### 环境要求

**必需的环境变量**：
- `POSTGRES_URL`：PostgreSQL 数据库连接字符串（需要 SSL）

**开发前准备**：
1. 设置 `POSTGRES_URL` 环境变量
2. 运行 `pnpm install` 安装依赖
3. 确保 PostgreSQL 数据库可访问

### ESLint 配置

使用 `@antfu/eslint-config`，启用：
- 严格模式
- TypeScript 规则
- React 规则
- Next.js 规则

Git 钩子通过 Husky 配置，提交前自动运行 `pnpm lint:fix`。

## 数据修改指南

当修改数据结构时，遵循以下顺序：
1. 更新 `app/lib/definitions.ts` 中的类型定义
2. 更新 `app/lib/data.ts` 中的查询函数
3. 更新 `app/lib/actions.ts` 中的 Server Actions（如果需要）
4. 更新使用这些数据的 UI 组件

## 数据库查询模式

使用 `postgres` 包的标签模板语法：
```typescript
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 参数化查询（安全）
const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;

// 插入数据
await sql`INSERT INTO invoices (customer_id, amount) VALUES (${customerId}, ${amount})`;
```

**重要**：始终使用参数化查询（`${variable}`）而不是字符串拼接，以防止 SQL 注入。

## 常见任务参考

- **添加仪表盘导航项**：编辑 `app/ui/dashboard/nav-links.tsx` 中的 `links` 数组
- **修改货币格式**：编辑 `app/lib/utils.ts` 中的 `formatCurrency` 函数
- **添加数据库查询**：在 `app/lib/data.ts` 中添加新函数，遵循现有的 try/catch 模式
- **创建表单 Server Action**：在 `app/lib/actions.ts` 中添加，使用 Zod 进行验证
- **保护新路由**：在 `auth.config.ts` 的 `authorized` 回调中添加逻辑
