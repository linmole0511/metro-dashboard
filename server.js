// server.js
const express = require('express');
const fetch = require('node-fetch'); // v2 版本
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3001; // 你可以自定义端口

const AMAP_KEY = '15e8697e16027ade95c7fd075ec8477e';

app.use(cors()); // 允许所有跨域请求，开发环境下使用
app.use(express.static(path.join(__dirname, 'public'))); // 添加静态文件服务

app.get('/api/nearby', async (req, res) => {
  const { lng, lat, radius = 2000 } = req.query;
  if (!lng || !lat) {
    return res.status(400).json({ error: '缺少经纬度参数' });
  }
  const types = encodeURIComponent('风景名胜|公园|景区|游乐园|动物园|植物园|广场|博物馆|展览馆|文化宫');
  const url = `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${lng},${lat}&radius=${radius}&types=${types}&extensions=all&offset=10&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '高德API请求失败', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`代理服务器已启动: http://localhost:${PORT}`);
});