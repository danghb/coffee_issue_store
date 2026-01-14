# 部署与维护指南 (Deployment Guide)

本文档说明如何从源码初始化项目，以及如何重置数据库环境。

## 1. 首次部署 (Initial Deployment)

如果您拿到的是一份干净的源码，请运行根目录下的 `deploy_project.bat` 脚本。

**功能：**
- 自动安装 Backend 和 Frontend 的依赖包 (`npm install`)
- 生成 Prisma 数据库客户端 (`prisma generate`)
- 创建 SQLite 数据库并同步表结构 (`db push`)
- **初始化默认数据** (`db seed`)，包括：
  - 默认设备机型 (M50, E60, K95PLUS 等)
  - 默认问题分类 (软件, 硬件, 结构, 其他)
  - **内置管理员账户** (用户名: `yfdz`, 密码: `yfdz@2026`)

**运行方法：**
双击 `deploy_project.bat` 或在终端运行：
```powershell
.\deploy_project.bat
```

---

## 2. 也是开发环境重置 (Reset Environment)

在开发完成后或测试开始前，如果你想清空所有测试数据，还原到“刚部署”的干净状态，请运行 `reset_db_clean.bat`。

**功能：**
- 强制清空数据库所有数据 (`--force-reset`)
- 重新运行种子脚本 (`db seed`) 恢复默认数据和管理员账户

**运行方法：**
双击 `reset_db_clean.bat` 或在终端运行：
```powershell
.\reset_db_clean.bat
```

> ⚠️ **警告**：此操作不可逆，会删除所有手动创建的问题记录和用户数据！

---

## 3. 默认管理员账号

部署或重置后，系统默认包含一个超级管理员账户：

- **用户名**: `yfdz`
- **密码**: `yfdz@2026`

请使用此账户登录进行后续配置或测试。
