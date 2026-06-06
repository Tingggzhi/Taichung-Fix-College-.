const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const BASE_DIR = __dirname;

// 建立無快取本地伺服器，直接服務根目錄下的靜態網頁
const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0]; // 忽略 query
    let reqPath = decodeURIComponent(reqUrl);
    
    if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
    }

    // 取得檔案絕對路徑
    let filePath = path.join(BASE_DIR, reqPath);
    
    // 如果檔案不存在，回退到首頁
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(BASE_DIR, 'index.html');
    }

    // 讀取並回傳
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('找不到檔案');
            return;
        }

        let ext = path.extname(filePath).toLowerCase();
        let contentType = 'text/html; charset=utf-8';
        if (ext === '.css') contentType = 'text/css; charset=utf-8';
        if (ext === '.js') contentType = 'application/javascript; charset=utf-8';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        if (ext === '.svg') contentType = 'image/svg+xml';
        if (ext === '.json') contentType = 'application/json; charset=utf-8';

        // 停用快取
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n=========================================================`);
    console.log(`🚀 [修學院 2.0 本地開發伺服器] 已成功啟動！`);
    console.log(`🔗 點擊或開啟：http://localhost:${PORT}/`);
    console.log(`✨ 伺服器正在直接服務根目錄下的 2.0 網頁，修改存檔即可刷新預覽。`);
    console.log(`=========================================================\n`);
});
