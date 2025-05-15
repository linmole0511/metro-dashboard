const fetch = require('node-fetch');

const AMAP_KEY = '15e8697e16027ade95c7fd075ec8477e';

exports.handler = async function(event, context) {
  // 只允许 GET 请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: '只允许 GET 请求' })
    };
  }

  // 获取查询参数
  const { lng, lat, radius = 2000 } = event.queryStringParameters || {};
  
  if (!lng || !lat) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '缺少经纬度参数' })
    };
  }

  const types = encodeURIComponent('风景名胜|公园|景区|游乐园|动物园|植物园|广场|博物馆|展览馆|文化宫');
  const url = `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}&location=${lng},${lat}&radius=${radius}&types=${types}&extensions=all&offset=10&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 允许跨域访问
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '高德API请求失败', detail: err.message })
    };
  }
}; 