# mybatis log helper

将 MyBatis 日志还原为可执行的 SQL 的 Chrome 浏览器扩展。

## 功能

- 解析 MyBatis `Preparing:` 和 `Parameters:` 日志，自动替换 `?` 占位符
- 支持 SELECT / INSERT / UPDATE / DELETE 全类型 SQL
- 支持 NULL、时间戳、日期、数字、字符串等常见参数类型
- 支持批量粘贴多条日志，一次性转换
- 可选 SQL 格式化（关键字换行）

## 安装

1. 克隆仓库或下载源码
   ```bash
   git clone https://github.com/ipromise2021/mybatis-sql-plugin.git
   ```
2. 打开 Chrome，地址栏输入 `chrome://extensions`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择本项目根目录
5. 点击工具栏扩展图标即可使用

## 使用

1. 从应用日志中复制 MyBatis 的 `Preparing:` 和 `Parameters:` 行
2. 粘贴到左侧输入框
3. 点击「开始转换」
4. 右侧输出可执行的 SQL，点击「复制 SQL」即可使用

支持粘贴格式示例：
```
==>  Preparing: SELECT * FROM user WHERE id = ? AND name = ?
==> Parameters: 1(Integer), 张三(String)
```

## 项目结构

```
├── manifest.json     # Chrome 扩展配置
├── background.js     # Service Worker（点击图标打开页面）
├── index.html        # 主页面
├── app.js            # 核心转换逻辑
├── index.css         # 样式
├── test.html         # 测试用例（浏览器打开即可运行）
└── icons/            # 扩展图标
```
