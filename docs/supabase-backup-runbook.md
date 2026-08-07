# Supabase 生产备份与恢复

当前生产 Supabase 位于腾讯云服务器 `/opt/changzhouai/supabase`。备份任务使用 Restic 加密后写入腾讯 COS 的隔离前缀，不依赖同机磁盘作为唯一副本。

## 备份内容

- PostgreSQL 主数据库的 custom-format 全库 dump，覆盖 `public`、`auth`、`storage` 等 schema。
- PostgreSQL 全局角色定义，不导出角色密码。
- `/opt/changzhouai/supabase/volumes/storage` 中的实际 Storage 对象。
- Supabase Compose、环境配置、初始化 SQL、Functions 和代理配置。
- 数据库 dump 与 Storage 文件的 SHA-256 校验清单。

不会直接备份在线 PostgreSQL data directory；数据库恢复以 `pg_dump` 产物为准，避免复制活跃数据目录产生不一致副本。

## 调度和保留

- 每 6 小时的第 17 分钟执行一次完整逻辑备份；Storage 由 Restic 自动分块、去重和增量上传。
- 每周日 04:37 执行仓库检查、完整恢复、Storage 校验和临时数据库恢复。
- 保留最近 28 个小时级快照、14 个日快照、8 个周快照和 12 个按月快照。
- 失败时通过飞书机器人通知管理员；成功时间写入 `/var/lib/changzhouai-backup/last-backup-success` 和 `last-restore-verify-success`。

## 生产文件

- `/usr/local/sbin/changzhouai-supabase-backup`
- `/usr/local/sbin/changzhouai-supabase-restore-verify`
- `/etc/changzhouai-backup/backup.env`，权限必须为 `0600`
- `/etc/changzhouai-backup/restic-password`，权限必须为 `0600`
- `/etc/cron.d/changzhouai-supabase-backup`
- `/etc/logrotate.d/changzhouai-supabase-backup`
- `/var/log/changzhouai-supabase-backup.log`
- `/var/log/changzhouai-supabase-verify.log`

Restic 密码还必须保存在服务器外的安全位置。当前运维机使用 macOS 钥匙串服务名 `changzhouai-supabase-restic` 保存恢复密码。

## 人工检查

```bash
sudo /usr/local/sbin/changzhouai-supabase-backup
sudo /usr/local/sbin/changzhouai-supabase-restore-verify
sudo bash -c 'source /etc/changzhouai-backup/backup.env && restic -o s3.bucket-lookup=dns -o "s3.region=${AWS_REGION}" snapshots --tag supabase'
sudo cat /var/lib/changzhouai-backup/last-backup-success
sudo cat /var/lib/changzhouai-backup/last-restore-verify-success
```

## 灾难恢复原则

1. 准备新的 Supabase Docker 环境，版本尽量与备份 manifest 中记录的数据库镜像一致。
2. 从运维机钥匙串取回 Restic 密码，并配置只读 COS 凭据。
3. `restic restore` 恢复指定快照。
4. 先恢复 `globals.sql` 所需角色，再用 `pg_restore` 恢复 `database.dump`。
5. 将快照里的 Storage 文件恢复到 `volumes/storage`。
6. 启动 Supabase 后检查 Auth 登录、成员资料、活动报名、后台查询与文件读取。
7. 恢复过程中不要覆盖仍可读取的原生产目录；先恢复到新目录或临时服务器完成验证。

COS 主资产桶与备份仓库是不同的数据用途。备份文件虽然由 Restic 加密，但仍应尽快迁移到独立、私有、开启版本控制的备份桶；当前隔离前缀属于权限受限时的过渡方案。
