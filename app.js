document.addEventListener('DOMContentLoaded', () => {
    const logInput = document.getElementById('logInput');
    const sqlOutput = document.getElementById('sqlOutput');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const formatCheckbox = document.getElementById('formatCheckbox');

    convertBtn.addEventListener('click', () => {
        const rawLog = logInput.value;
        if (!rawLog.trim()) {
            sqlOutput.textContent = '请输入 MyBatis 日志';
            return;
        }

        try {
            const convertedSql = convertMybatisLog(rawLog, formatCheckbox.checked);
            sqlOutput.textContent = convertedSql || '未识别到有效的 MyBatis 语句 (请确保包含 Preparing: 和 Parameters: 关键字)';
        } catch (e) {
            sqlOutput.textContent = '解析出错: ' + e.message;
        }
    });

    clearBtn.addEventListener('click', () => {
        logInput.value = '';
        sqlOutput.textContent = '转换后的 SQL 将显示在这里...';
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = sqlOutput.textContent;
        if (textToCopy && textToCopy !== '转换后的 SQL 将显示在这里...' && textToCopy !== '请输入 MyBatis 日志') {
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyBtn.classList.add('copied');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 1800);
            });
        }
    });
});

function convertMybatisLog(logText, shouldFormat) {
    const lines = logText.split('\n');
    let preparingSql = '';
    let pendingParams = null; // 缓存在 Preparing 之前出现的 Parameters
    let resultSqls = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.includes('Preparing:')) {
            // 如果上一个 preparing 还没有处理参数（说明可能是无参SQL），直接放入结果
            if (preparingSql) {
                let formattedSql = preparingSql;
                if (shouldFormat) formattedSql = formatSql(formattedSql);
                resultSqls.push(formattedSql + ';');
            }
            preparingSql = line.substring(line.indexOf('Preparing:') + 10).trim();

            // 如果有缓存的参数（Parameters 出现在 Preparing 之前的情况）
            if (pendingParams !== null) {
                let formattedSql = restoreSql(preparingSql, pendingParams);
                if (shouldFormat) formattedSql = formatSql(formattedSql);
                resultSqls.push(formattedSql + ';');
                preparingSql = '';
                pendingParams = null;
            }
        } else if (line.includes('Parameters:')) {
            const paramsStr = line.substring(line.indexOf('Parameters:') + 11).trim();
            if (preparingSql) {
                let formattedSql = restoreSql(preparingSql, paramsStr);
                if (shouldFormat) formattedSql = formatSql(formattedSql);
                resultSqls.push(formattedSql + ';');
                preparingSql = '';
            } else {
                // Parameters 出现在 Preparing 之前，缓存起来
                pendingParams = paramsStr;
            }
        }
    }

    // 结尾如果还有未处理的无参 SQL
    if (preparingSql) {
       let formattedSql = preparingSql;
       if (shouldFormat) {
            formattedSql = formatSql(formattedSql);
       }
       resultSqls.push(formattedSql + ';');
    }

    return resultSqls.join('\n\n------------------------------------------------------------\n\n');
}

function restoreSql(sql, paramsStr) {
    if (!paramsStr) return sql;
    
    const params = parseMyBatisParams(paramsStr);
    let result = '';
    let paramIndex = 0;
    
    for (let i = 0; i < sql.length; i++) {
        if (sql[i] === '?') {
            if (paramIndex < params.length) {
                let p = params[paramIndex];
                if (p.value === 'NULL') {
                    result += 'NULL';
                } else {
                    result += p.needQuote ? `'${p.value}'` : p.value;
                }
                paramIndex++;
            } else {
                result += '?'; // 参数数量不匹配，保留 ?
            }
        } else {
            result += sql[i];
        }
    }
    return result;
}

function parseMyBatisParams(paramString) {
    if (!paramString || paramString.trim() === '') return [];

    const params = [];
    const quotedTypes = ['String', 'Timestamp', 'Date', 'Time', 'LocalDate', 'LocalTime', 'LocalDateTime', 'Char'];
    let remaining = paramString.trim();

    while (remaining.length > 0) {
        // 优先匹配 null（大小写不敏感，后跟逗号或结尾）
        if (/^null\s*(?:,|$)/i.test(remaining)) {
            params.push({ value: 'NULL', needQuote: false });
            remaining = remaining.replace(/^null\s*,?\s*/, '');
            continue;
        }

        // 找到第一个 (AlphaType) 且其后紧跟 , 或结尾的 —— 这才是真正的类型注解
        const typeRegex = /\(([a-zA-Z]+)\)(?=\s*(?:,|$))/g;
        const match = typeRegex.exec(remaining);
        if (!match) break;

        const val = remaining.substring(0, match.index);
        const type = match[1];
        const needQuote = quotedTypes.includes(type);
        params.push({ value: val, needQuote: needQuote });

        remaining = remaining.substring(match.index + match[0].length);
        remaining = remaining.replace(/^\s*,\s*/, '');
    }
    return params;
}

function formatSql(sql) {
    const keywords = ['FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'LIMIT', 'HAVING'];
    let formatted = sql;
    keywords.forEach(kw => {
        // 在关键字前加换行，如果原来没有换行的话
        const regex = new RegExp(`\\s+${kw}\\s+`, 'gi');
        formatted = formatted.replace(regex, `\n${kw} `);
    });
    return formatted;
}
