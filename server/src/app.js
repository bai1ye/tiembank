const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');

const app = express();

// CORS配置
const corsOptions = {
    origin:'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// 路由
app.use('/api/users', userRoutes);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        message: '请求的资源不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, _next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            code: 400,
            message: '输入验证失败',
            errors: err.errors
        });
    }

    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            code: 401,
            message: '无效的认证令牌'
        });
    }

    // JWT过期
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            code: 401,
            message: '认证令牌已过期'
        });
    }

    // 默认服务器错误
    res.status(500).json({
        code: 500,
        message: '服务器内部错误'
    });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, _promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

module.exports = app;