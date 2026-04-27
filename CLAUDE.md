# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Chrome 浏览器扩展（Manifest V3），将 MyBatis 日志（`Preparing:` + `Parameters:`）转换为可执行 SQL。纯前端项目，无构建工具或包管理器。

## 加载与测试

在 Chrome 地址栏输入 `chrome://extensions`，开启"开发者模式"，点击"加载已解压的扩展程序"，选择本项目根目录。加载后点击工具栏扩展图标即可在新标签页打开转换器。

没有自动化测试、lint 或构建命令。

## 架构

- `background.js` — Service worker，仅负责监听 `chrome.action.onClicked` 并打开 `index.html`
- `index.html` — 独立页面（非 popup），包含左右双栏布局：左侧输入原始日志，右侧输出转换后 SQL
- `app.js` — 全部业务逻辑，处理流程：
  1. `convertMybatisLog()` 逐行解析，识别 `Preparing:` 和 `Parameters:` 行，支持多条 SQL 批量转换
  2. `restoreSql()` 将 SQL 中的 `?` 占位符替换为实际参数值
  3. `parseMyBatisParams()` 用正则从参数字符串中提取值和类型，判断是否需要加引号（String/Date/Timestamp 等类型加引号，数字类型不加）
  4. `formatSql()` 在 SQL 关键字（FROM、WHERE、JOIN 等）前插入换行
- `index.css` — 深色主题样式，1024px 断点处面板从垂直布局切换为水平双栏
