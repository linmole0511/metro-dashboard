import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import './StationInfo.css';
import { Modal, Select, Button, Table, message } from 'antd';
import 'antd/dist/reset.css';
import ReactEcharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart, RadarChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DataZoomComponent,
    LegendComponent,
    RadarComponent
} from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import * as XLSX from 'xlsx';

// 注册必要的组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DataZoomComponent,
    LegendComponent,
    RadarComponent,
    LineChart,
    RadarChart,
    CanvasRenderer,
    SVGRenderer
]);

const StationInfo = () => {
    const { stationName } = useParams();
    const navigate = useNavigate();
    const [map, setMap] = useState(null);
    const mapContainerRef = useRef(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedPOI, setSelectedPOI] = useState(null);
    const modalMapRef = useRef(null);
    const [modalMap, setModalMap] = useState(null);
    const [trendTimeArray, setTrendTimeArray] = useState([]);
    const [trendFlowArray, setTrendFlowArray] = useState([]);
    const [downTrendTimeArray, setDownTrendTimeArray] = useState([]);
    const [downTrendFlowArray, setDownTrendFlowArray] = useState([]);
    const [direction, setDirection] = useState('up'); // 'up' 或 'down'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 添加时间段选择状态到组件顶层
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);

    // 站点数据
    const stationData = {
        "朝天门": {
            name: "朝天门站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["朝天门广场", "重庆大剧院", "洪崖洞", "解放碑"],
            status: "正常运营"
        },
        "小什字": {
            name: "小什字站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["解放碑", "洪崖洞", "长江索道"],
            status: "正常运营"
        },
        "较场口": {
            name: "较场口站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["解放碑", "较场口夜市", "重庆大剧院"],
            status: "正常运营"
        },
        "七星岗": {
            name: "七星岗站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["七星岗公园", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "两路口": {
            name: "两路口站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["两路口商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "鹅岭": {
            name: "鹅岭站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["鹅岭公园", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "大坪": {
            name: "大坪站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["大坪商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "石油路": {
            name: "石油路站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["石油路商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "石桥铺": {
            name: "石桥铺站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["石桥铺商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "高庙村": {
            name: "高庙村站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["高庙村商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "马家岩": {
            name: "马家岩站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["马家岩商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "小龙坎": {
            name: "小龙坎站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["小龙坎商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "沙坪坝": {
            name: "沙坪坝站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["沙坪坝商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "杨公桥": {
            name: "杨公桥站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["杨公桥商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "烈士墓": {
            name: "烈士墓站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["烈士墓公园", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "磁器口": {
            name: "磁器口站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["磁器口古镇", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "石井坡": {
            name: "石井坡站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["石井坡商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "双碑": {
            name: "双碑站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["双碑商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "赖家桥": {
            name: "赖家桥站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["赖家桥商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "微电园": {
            name: "微电园站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店"],
            exits: ["A出口", "B出口", "C出口"],
            nearby: ["微电园商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "陈家桥": {
            name: "陈家桥站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["陈家桥商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "大学城": {
            name: "大学城站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["大学城商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "尖顶坡": {
            name: "尖顶坡站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
            exits: ["A出口", "B出口"],
            nearby: ["尖顶坡商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        },
        "璧山": {
            name: "璧山站",
            line: "1号线",
            openTime: "06:30-22:30",
            facilities: ["无障碍电梯", "自动扶梯", "卫生间", "便利店", "自动售票机"],
            exits: ["A出口", "B出口", "C出口", "D出口"],
            nearby: ["璧山商圈", "重庆大剧院", "解放碑"],
            status: "正常运营"
        }
    };

    // 站点坐标数据
    const line1Stations = [
        { name: "朝天门", lng: 106.585845, lat: 29.564142 },
        { name: "小什字", lng: 106.583593, lat: 29.560028 },
        { name: "较场口", lng: 106.574352, lat: 29.553575 },
        { name: "七星岗", lng: 106.56291, lat: 29.554914 },
        { name: "两路口", lng: 106.54938, lat: 29.552478 },
        { name: "鹅岭", lng: 106.533923, lat: 29.547986 },
        { name: "大坪", lng: 106.51845396, lat: 29.54068085 },
        { name: "石油路", lng: 106.508308, lat: 29.53811 },
        { name: "歇台子", lng: 106.49813086, lat: 29.53551660 },
        { name: "石桥铺", lng: 106.484891, lat: 29.532771 },
        { name: "高庙村", lng: 106.469211, lat: 29.536409 },
        { name: "马家岩", lng: 106.468033, lat: 29.544984 },
        { name: "小龙坎", lng: 106.468225, lat: 29.553697 },
        { name: "沙坪坝", lng: 106.460425, lat: 29.556003 },
        { name: "杨公桥", lng: 106.450227, lat: 29.561544 },
        { name: "烈士墓", lng: 106.445437, lat: 29.567434 },
        { name: "磁器口", lng: 106.44642, lat: 29.576719 },
        { name: "石井坡", lng: 106.444283, lat: 29.589415 },
        { name: "双碑", lng: 106.44437, lat: 29.605775 },
        { name: "赖家桥", lng: 106.381441, lat: 29.610285 },
        { name: "微电园", lng: 106.362894, lat: 29.609665 },
        { name: "陈家桥", lng: 106.328499, lat: 29.607427 },
        { name: "大学城", lng: 106.308908, lat: 29.60735 },
        { name: "尖顶坡", lng: 106.292967, lat: 29.607324 },
        { name: "璧山", lng: 106.23261, lat: 29.61225 }
    ];

    // 周边设施数据
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [loadingPlaces, setLoadingPlaces] = useState(false);
    const [placesError, setPlacesError] = useState(null);

    // 换乘站列表
    const transferStations = ["大坪", "两路口", "较场口", "小什字", "沙坪坝", "小龙坎", "石桥铺", "歇台子", "七星岗"];

    const station = stationData[stationName] || {
        name: `${stationName}站`,
        line: "1号线",
        openTime: "06:30-22:30",
        facilities: ["无障碍电梯", "自动扶梯", "卫生间"],
        exits: ["A出口", "B出口"],
        nearby: ["周边商圈"],
        status: "正常运营"
    };

    // 站点名到CSV列名映射（原有，带括号）
    const stationNameToCsvKey = {
        "朝天门": "S1(换乘站)",
        "小什字": "S2",
        "较场口": "S3(换乘站)",
        "七星岗": "S4",
        "两路口": "S5(换乘站)",
        "鹅岭": "S6",
        "大坪": "S7(换乘站)",
        "石油路": "S8(换乘站)",
        "歇台子": "S9",
        "石桥铺": "S10",
        "高庙村": "S11",
        "马家岩": "S12(换乘站)",
        "小龙坎": "S13",
        "沙坪坝": "S14",
        "杨公桥": "S15",
        "烈士墓": "S16",
        "磁器口": "S17",
        "石井坡": "S18",
        "双碑": "S19",
        "赖家桥": "S20",
        "微电园": "S21",
        "陈家桥": "S22",
    };

    // 站点名到编号映射（新增，无括号，仅用于接口请求）
    const stationNameToCode = {
        "朝天门": "S1",
        "小什字": "S2",
        "较场口": "S3",
        "七星岗": "S4",
        "两路口": "S5",
        "鹅岭": "S6",
        "大坪": "S7",
        "石油路": "S8",
        "歇台子": "S9",
        "石桥铺": "S10",
        "高庙村": "S11",
        "马家岩": "S12",
        "小龙坎": "S13",
        "沙坪坝": "S14",
        "杨公桥": "S15",
        "烈士墓": "S16",
        "磁器口": "S17",
        "石井坡": "S18",
        "双碑": "S19",
        "赖家桥": "S20",
        "微电园": "S21",
        "陈家桥": "S22"
    };

    // 雷达图状态
    const [tendencyData, setTendencyData] = useState(null);
    const [tendencyLoading, setTendencyLoading] = useState(true);
    const [tendencyError, setTendencyError] = useState(null);

    // 原始数据弹窗状态
    const [rawModalOpen, setRawModalOpen] = useState(false);

    // 新增原始数据
    const [rawTendencyData, setRawTendencyData] = useState([]);
    const [rawTendencyLoading, setRawTendencyLoading] = useState(false);
    const [rawTendencyError, setRawTendencyError] = useState(null);

    // 拉取原始数据
    const fetchRawTendencyData = async () => {
        setRawTendencyLoading(true);
        setRawTendencyError(null);
        try {
            const upOrDown = direction === 'up' ? '上行' : '下行';
            // 1. 原始Excel
            const rawFile = `/${stationNameToCode[stationName]}${upOrDown}态势指标.xlsx`;
            const rawRes = await fetch(rawFile);
            if (!rawRes.ok) throw new Error('原始Excel文件加载失败');
            const rawBuffer = await rawRes.arrayBuffer();
            const rawWorkbook = XLSX.read(rawBuffer, { type: 'array' });
            const rawSheet = rawWorkbook.Sheets[rawWorkbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(rawSheet);
            // 2. 计算结果第10表单第8列
            const resultFile = `/${stationNameToCode[stationName]}${upOrDown}态势指标计算结果.xlsx`;
            const resultRes = await fetch(resultFile);
            if (!resultRes.ok) throw new Error('计算结果Excel文件加载失败');
            const resultBuffer = await resultRes.arrayBuffer();
            const resultWorkbook = XLSX.read(resultBuffer, { type: 'array' });
            const col8Sheet = resultWorkbook.Sheets[resultWorkbook.SheetNames[9]];
            const col8Json = XLSX.utils.sheet_to_json(col8Sheet);
            const col8Values = col8Json.map(row => {
                const keys = Object.keys(row);
                return keys.length > 7 ? row[keys[7]] : '';
            });
            // 3. 拼接5列（第2~5列+相对接近度）
            const allColNames = Object.keys(rawData[0]);
            const dataColNames = allColNames.slice(1, 5); // 第2~5列
            const tableData = rawData.map((row, idx) => {
                const obj = { key: idx };
                dataColNames.forEach(name => {
                    let val = row[name];
                    if (name === '站台拥挤度' || name === '车厢拥挤度') {
                        // 百分比转化
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                            val = (num * 100).toFixed(2) + '%';
                        }
                    }
                    obj[name] = val;
                });
                obj['相对接近度'] = col8Values[idx] !== undefined ? col8Values[idx] : '';
                return obj;
            });
            setRawTendencyData(tableData);
        } catch (err) {
            setRawTendencyError(err.message);
            setRawTendencyData([]);
            message.error('原始数据加载失败: ' + err.message);
        } finally {
            setRawTendencyLoading(false);
        }
    };

    // 原始数据表格列
    const rawTableColumns = rawTendencyData.length > 0
        ? Object.keys(rawTendencyData[0])
            .filter(k => k !== 'key')
            .map(key => ({ title: key, dataIndex: key, key, align: 'center' }))
        : [];

    // 初始化地图
    useEffect(() => {
        if (mapContainerRef.current) {
            AMapLoader.load({
                key: 'f47b354d20162e8c045cf6974165d0f0',
                version: '2.0',
                plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.ControlBar', 'AMap.PlaceSearch'],
                securityJsCode: '78b8bb3c9a19f1d38fd4e13226917913'
            }).then((AMap) => {
                try {
                    const newMap = new AMap.Map(mapContainerRef.current, {
                        center: [106.551643, 29.563761],
                        zoom: 15,
                        viewMode: '2D',
                        mapStyle: 'amap://styles/normal',
                        features: ['bg', 'road', 'building', 'point'],
                        defaultCursor: 'pointer',
                        zooms: [3, 20],
                        showBuildingBlock: true,
                        showIndoorMap: true,
                        buildingAnimation: true,
                        pitchEnable: true,
                        rotateEnable: true,
                        isHotspot: true,
                        expandZoomRange: true,
                        resizeEnable: true
                    });

                    // 添加地图控件
                    newMap.addControl(new AMap.Scale());
                    newMap.addControl(new AMap.ToolBar({ position: 'RB' }));
                    newMap.addControl(new AMap.ControlBar({ position: { right: '10px', top: '10px' } }));

                    window.AMap = AMap;
                    setMap(newMap);
                    console.log('地图初始化成功', newMap);
                } catch (error) {
                    console.error('地图初始化失败:', error);
                    if (map) {
                        map.destroy();
                        setMap(null);
                    }
                }
            }).catch(err => {
                console.error('加载高德地图失败:', err);
            });
        }
    }, []);

    // 获取周边设施数据
    useEffect(() => {
        const fetchNearbyPlaces = async () => {
            if (!stationName) return;
            setLoadingPlaces(true);
            setPlacesError(null);
            try {
                const station = line1Stations.find(s => s.name === stationName);
                if (!station) throw new Error('未找到站点数据');
                const url = `http://localhost:3001/api/nearby?lng=${station.lng}&lat=${station.lat}&radius=2000`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('高德API响应异常');
                const data = await response.json();
                if (data.status !== '1' || !Array.isArray(data.pois)) throw new Error('高德API数据异常');
                const playKeywords = ['景点', '公园', '风景名胜', '景区', '游乐园', '动物园', '植物园', '广场', '博物馆', '展览馆', '文化宫'];
                const places = data.pois
                    .filter(poi => playKeywords.some(keyword => poi.type && poi.type.includes(keyword)))
                    .slice(0, 10)
                    .map(poi => ({
                        name: poi.name,
                        lng: poi.location.split(',')[0],
                        lat: poi.location.split(',')[1],
                        type: poi.type,
                        address: poi.address
                    }));
                setNearbyPlaces(places);
            } catch (err) {
                setPlacesError('地图服务暂不可用');
                setNearbyPlaces([
                    { name: '周边景点', type: '风景名胜', address: '站点周边' },
                    { name: '周边公园', type: '公园', address: '站点周边' },
                    { name: '周边景区', type: '景区', address: '站点周边' },
                    { name: '周边广场', type: '广场', address: '站点周边' }
                ]);
            } finally {
                setLoadingPlaces(false);
            }
        };
        fetchNearbyPlaces();
    }, [stationName]);

    // 点击POI时弹窗
    const handlePlaceClick = (place) => {
        setSelectedPOI(place);
        setShowMapModal(true);
    };

    // 弹窗地图初始化
    useEffect(() => {
        let mapInstance = null;

        const initMap = async () => {
            if (!showMapModal || !selectedPOI) return;
            // 等待DOM渲染，确保ref已挂载
            await new Promise(resolve => setTimeout(resolve, 0));
            if (!modalMapRef.current) return;

            try {
                const AMap = await AMapLoader.load({
                    key: 'f47b354d20162e8c045cf6974165d0f0',
                    version: '2.0',
                    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.ControlBar'],
                    securityJsCode: '78b8bb3c9a19f1d38fd4e13226917913'
                });

                const station = line1Stations.find(s => s.name === stationName);
                if (!station) {
                    console.error('未找到站点数据:', stationName);
                    return;
                }

                mapInstance = new AMap.Map(modalMapRef.current, {
                    center: [parseFloat(selectedPOI.lng), parseFloat(selectedPOI.lat)],
                    zoom: 16,
                    viewMode: '2D',
                    resizeEnable: true,
                    features: ['bg', 'road', 'building', 'point'],
                    mapStyle: 'amap://styles/normal'
                });

                mapInstance.on('complete', () => {
                    new AMap.Marker({
                        position: [station.lng, station.lat],
                        title: station.name,
                        icon: new AMap.Icon({
                            size: new AMap.Size(25, 34),
                            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                            imageSize: new AMap.Size(25, 34)
                        })
                    }).setMap(mapInstance);

                    const placeMarker = new AMap.Marker({
                        position: [parseFloat(selectedPOI.lng), parseFloat(selectedPOI.lat)],
                        title: selectedPOI.name,
                        icon: new AMap.Icon({
                            size: new AMap.Size(25, 34),
                            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
                            imageSize: new AMap.Size(25, 34)
                        })
                    });
                    placeMarker.setMap(mapInstance);

                    const infoWindow = new AMap.InfoWindow({
                        content: `
                            <div class="info-window">
                                <h3>${selectedPOI.name}</h3>
                                <p>类型：${selectedPOI.type}</p>
                                <p>地址：${selectedPOI.address}</p>
                            </div>
                        `,
                        offset: new AMap.Pixel(0, -30)
                    });
                    infoWindow.open(mapInstance, placeMarker.getPosition());

                    mapInstance.setFitView([placeMarker, new AMap.Marker({
                        position: [station.lng, station.lat]
                    })]);

                    mapInstance.addControl(new AMap.Scale());
                    mapInstance.addControl(new AMap.ToolBar({ position: 'RB' }));
                    mapInstance.addControl(new AMap.ControlBar({ position: { right: '10px', top: '10px' } }));
                });

                setModalMap(mapInstance);
            } catch (error) {
                console.error('地图初始化失败:', error);
                if (mapInstance) {
                    mapInstance.destroy();
                    mapInstance = null;
                }
                setModalMap(null);
            }
        };

        if (showMapModal && selectedPOI) {
            initMap();
        }

        return () => {
            if (mapInstance) {
                mapInstance.destroy();
                mapInstance = null;
                setModalMap(null);
            }
        };
    }, [showMapModal, selectedPOI, stationName]);

    useEffect(() => {
        if (showMapModal && modalMap) {
            setTimeout(() => {
                if (modalMap && modalMap.resize) {
                    modalMap.resize();
                }
            }, 100);
        }
    }, [showMapModal, modalMap]);

    useEffect(() => {
        const stationCode = stationNameToCode[stationName];
        console.log('热力图 CSV加载 - 当前站点:', stationName, '方向:', direction, 'CSV Key:', stationNameToCsvKey[stationName]);

        if (!stationCode) {
            setLoading(false);
            setError(`站点 ${stationName} 未配置有效的CSV键值用于客流统计。`);
            setTrendTimeArray([]);
            setTrendFlowArray([]);
            setDownTrendTimeArray([]);
            setDownTrendFlowArray([]);
            return;
        }

        setLoading(true);
        setError(null);

        const fileName = direction === 'up' ? 'up_flow_8_10.csv' : 'down_flow_8_10.csv';
        const filePath = `http://localhost:3001/${fileName}`;
        console.log(`热力图 CSV加载 - 正在加载文件: ${filePath}`);

        fetch(filePath)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`文件加载失败: ${res.status} ${res.statusText} (路径: ${filePath})`);
                }
                return res.text();
            })
            .then(text => {
                const lines = text.trim().split('\n');
                if (lines.length <= 1) {
                    console.warn(`CSV文件 ${fileName} 为空或只有表头。`);
                    if (direction === 'up') {
                        setTrendTimeArray([]);
                        setTrendFlowArray([]);
                        setDownTrendTimeArray([]); // 确保另一方向也清空
                        setDownTrendFlowArray([]);
                    } else {
                        setDownTrendTimeArray([]);
                        setDownTrendFlowArray([]);
                        setTrendTimeArray([]); // 确保另一方向也清空
                        setTrendFlowArray([]);
                    }
                    return;
                }
                const header = lines[0].split(',');
                const colIndex = header.indexOf(stationNameToCsvKey[stationName]);

                if (colIndex === -1) {
                    console.warn(`在 ${fileName} 中未找到列: ${stationNameToCsvKey[stationName]}。表头为:`, header.join(', '));
                    setTrendTimeArray([]);
                    setTrendFlowArray([]);
                    setDownTrendTimeArray([]);
                    setDownTrendFlowArray([]);
                    setError(`在 ${fileName} 中未找到站点 ${stationName} 的数据列（${stationNameToCsvKey[stationName]}）。`);
                    return;
                }

                const times = [];
                const flows = [];
                for (let i = 1; i < lines.length; i++) {
                    const arr = lines[i].split(',');
                    if (arr.length > colIndex) {
                        times.push(arr[0]);
                        flows.push(Number(arr[colIndex]) || 0);
                    }
                }

                const groupSize = 30;
                const aggTimes = [];
                const aggFlows = [];
                for (let i = 0; i < times.length; i += groupSize) {
                    aggTimes.push(times[i]);
                    const group = flows.slice(i, i + groupSize);
                    const sum = group.reduce((a, b) => a + b, 0);
                    aggFlows.push(sum);
                }

                if (direction === 'up') {
                    setTrendTimeArray(aggTimes);
                    setTrendFlowArray(aggFlows);
                    setDownTrendTimeArray([]); 
                    setDownTrendFlowArray([]);
                    console.log(`热力图 CSV加载 - 上行数据加载完成: ${aggTimes.length} 时间点, ${aggFlows.length} 流量点`);
                } else { // direction === 'down'
                    setDownTrendTimeArray(aggTimes);
                    setDownTrendFlowArray(aggFlows);
                    setTrendTimeArray([]); 
                    setTrendFlowArray([]);
                    console.log(`热力图 CSV加载 - 下行数据加载完成: ${aggTimes.length} 时间点, ${aggFlows.length} 流量点`);
                }
            })
            .catch(err => {
                console.error(`加载热力图数据 (${fileName}) 失败:`, err);
                setError(`客流统计数据加载失败 (${fileName})。请检查文件是否存在或网络连接。`);
                setTrendTimeArray([]);
                setTrendFlowArray([]);
                setDownTrendTimeArray([]);
                setDownTrendFlowArray([]);
            })
            .finally(() => setLoading(false));
    }, [stationName, direction]);

    useEffect(() => {
        const stationCode = stationNameToCode[stationName];
        console.log('热力图 CSV加载 - 当前站点:', stationName, '方向:', direction, 'CSV Key:', stationNameToCsvKey[stationName]);

        if (!stationCode) {
            setTendencyData(null);
            setTendencyError(null);
            setTendencyLoading(false);
            return;
        }
        const upOrDown = direction === 'up' ? '上行' : '下行';
        async function fetchExcelTendency() {
            try {
                setTendencyLoading(true);
                setTendencyError(null);
                // 读取"计算结果"文件
                const resultFile = `/${stationCode}${upOrDown}态势指标计算结果.xlsx`;
                console.log('正在加载文件:', resultFile);
                const resultRes = await fetch(resultFile);
                if (!resultRes.ok) throw new Error('Excel文件加载失败');
                const resultBuffer = await resultRes.arrayBuffer();
                // 1. 指标表（第一个表单）
                const resultWorkbook = XLSX.read(resultBuffer, { type: 'array' });
                const dataSheet = resultWorkbook.Sheets[resultWorkbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(dataSheet);
                // 2. 查找第10个表单的第8列（相对接近度）
                const col8Sheet = resultWorkbook.Sheets[resultWorkbook.SheetNames[9]];
                const col8Json = XLSX.utils.sheet_to_json(col8Sheet);
                const col8Values = col8Json.map(row => {
                    const keys = Object.keys(row);
                    return keys.length > 7 ? row[keys[7]] : '';
                });
                if (!data || !Array.isArray(data) || data.length === 0) {
                    throw new Error('Excel数据格式错误');
                }
                setTendencyData({ data, col8Values });
                console.log('实际读取到的字段名:', Object.keys(data[0]));
                console.log('data:', data);
                console.log('col8Values:', col8Values);
            } catch (err) {
                console.error('Excel数据加载错误:', err);
                setTendencyError('Excel数据加载失败: ' + err.message);
                setTendencyData(null);
            } finally {
                setTendencyLoading(false);
            }
        }
        fetchExcelTendency();
    }, [stationName, direction]);

    // 选取当前方向的数据
    const currentTimeArray = direction === 'up' ? trendTimeArray : downTrendTimeArray;
    const currentFlowArray = direction === 'up' ? trendFlowArray : downTrendFlowArray;
    const hasTrendData = currentTimeArray.length > 1 && currentFlowArray.length > 1 && currentTimeArray.length === currentFlowArray.length;

    console.log('currentTimeArray:', currentTimeArray);
    console.log('currentFlowArray:', currentFlowArray);
    console.log('hasTrendData:', hasTrendData);

    // 使用 useMemo 优化数据处理
    const trendOptionMemo = useMemo(() => {
        if (!hasTrendData) return null;

        const maxFlow = Math.max(...currentFlowArray);
        return {
            tooltip: {
                confine: true,
                position: function (point, params, dom, rect, size) {
                    var x = point[0];
                    var y = point[1];
                    if (y + size.contentSize[1] > size.viewSize[1]) {
                        y = size.viewSize[1] - size.contentSize[1] - 10;
                    }
                    return [x, y + 10];
                },
                formatter: function (params) {
                    const idx = params.dataIndex;
                    const start = currentTimeArray[idx];
                    const end = currentTimeArray[idx + 1] || start;
                    return `${start} - ${end}<br/>客流量: ${params.value[2]}人`;
                }
            },
            grid: {
                top: '10%',
                bottom: 60,
                left: '5%',
                right: '5%'
            },
            xAxis: {
                type: 'category',
                data: currentTimeArray,
                splitArea: {
                    show: true
                },
                axisLabel: {
                    rotate: 45,
                    formatter: function (value) {
                        return value.slice(0, 5);
                    }
                }
            },
            yAxis: {
                type: 'category',
                data: [''],
                splitArea: {
                    show: true
                }
            },
            series: [{
                name: '客流量',
                type: 'heatmap',
                data: currentTimeArray.map((time, index) => [
                    time,
                    '',
                    currentFlowArray[index]
                ]),
                label: {
                    show: false
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }],
            visualMap: {
                min: 0,
                max: maxFlow,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                width: '40%',
                bottom: -18,
                inRange: {
                    color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
                },
                textStyle: {
                    color: '#666'
                },
                showLabel: false
            }
        };
    }, [currentTimeArray, currentFlowArray, hasTrendData]);

    // 渲染态势指标表格
    const renderTendencyTable = () => {
        if (!tendencyData) return <div className="no-data">暂无数据</div>;
        // 1. 指标表（雷达图）
        let radarChart = null;
        if (tendencyData.data && tendencyData.data.length > 0 && tendencyData.col8Values) {
            const allColNames = Object.keys(tendencyData.data[0]);
            let dataColNames = allColNames.slice(1, 5); // 第2~5列
            const safeIndex = Math.min(selectedTimeIndex, tendencyData.data.length - 1, tendencyData.col8Values.length - 1);
            const valueArr = [
                ...dataColNames.map(name => {
                    const value = tendencyData.data[safeIndex][name];
                    return typeof value === 'string' ? Number(value) || 0 : Number(value) || 0;
                }),
                Number(tendencyData.col8Values[safeIndex]) || 0
            ];
            const indicator = [
                ...dataColNames.map(name => ({ name, max: 1 })),
                { name: '相对接近度', max: 1 }
            ];
            const radarOption = {
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        let result = `${params.name}<br/>`;
                        indicator.forEach((item, idx) => {
                            if (item.name === '相对接近度') {
                                result += `${item.name}: ${params.value[idx]}<br/>`;
                            } else {
                                result += `${item.name}: ${params.value[idx]}（归一化）<br/>`;
                            }
                        });
                        return result;
                    }
                },
                radar: {
                    indicator,
                    radius: '65%',
                    splitNumber: 4,
                    axisName: {
                        color: '#333',
                        fontSize: 12,
                        backgroundColor: '#fff',
                        borderRadius: 3,
                        padding: [3, 5]
                    },
                    splitArea: {
                        areaStyle: {
                            color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']
                        }
                    }
                },
                series: [{
                    type: 'radar',
                    data: [{
                        value: valueArr,
                        name: (() => {
                            const startHour = 8;
                            const startMinute = selectedTimeIndex * 15;
                            const endMinute = (selectedTimeIndex + 1) * 15;
                            const formatTime = (hour, minute) => {
                                const h = hour + Math.floor(minute / 60);
                                const m = minute % 60;
                                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            };
                            return `${formatTime(startHour, startMinute)}-${formatTime(startHour, endMinute)}`;
                        })(),
                        areaStyle: {
                            opacity: 0.3,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: 'rgba(58,77,233,0.8)' },
                                { offset: 1, color: 'rgba(58,77,233,0.3)' }
                            ])
                        },
                        lineStyle: {
                            width: 2,
                            color: '#3a4de9'
                        },
                        symbol: 'circle',
                        symbolSize: 6
                    }]
                }]
            };
            radarChart = (
                <div className="tendency-table-container" style={{
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    padding: 0,
                    margin: 0
                }}>
                    <ReactEcharts
                        option={radarOption}
                        style={{ height: 340, width: '100%', minWidth: 0, maxWidth: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            );
        }
        return (
            <div className="tendency-tables">
                {radarChart}
            </div>
        );
    };

    // 评价函数
    function getRelativeScoreText(val) {
        if (typeof val !== 'number' || isNaN(val)) return '无数据';
        if (val >= 0.8) return '优良';
        if (val >= 0.6) return '良好';
        if (val >= 0.4) return '一般';
        return '较差';
    }

    // 计算当前时间段的相对接近度及评价，供chart-header使用
    let relativeText = '无数据';
    if (
        tendencyData &&
        tendencyData.col8Values &&
        Array.isArray(tendencyData.col8Values) &&
        tendencyData.col8Values.length > selectedTimeIndex &&
        tendencyData.col8Values[selectedTimeIndex] !== undefined &&
        tendencyData.col8Values[selectedTimeIndex] !== '' &&
        !isNaN(Number(tendencyData.col8Values[selectedTimeIndex]))
    ) {
        const relVal = Number(tendencyData.col8Values[selectedTimeIndex]);
        relativeText = getRelativeScoreText(relVal);
    }

    // 可以添加一个批量检查函数
    const checkStationData = async (stationCode) => {
        const files = [
            `/${stationCode}上行态势指标.xlsx`,
            `/${stationCode}下行态势指标.xlsx`,
            `/${stationCode}上行态势指标计算结果.xlsx`,
            `/${stationCode}下行态势指标计算结果.xlsx`
        ];
        
        for (const file of files) {
            try {
                const res = await fetch(file);
                if (!res.ok) {
                    console.error(`${stationCode} 缺少文件: ${file}`);
                }
            } catch (err) {
                console.error(`${stationCode} 文件检查失败: ${file}`, err);
            }
        }
    };

    return (
        <div className="station-info">
            <div className="station-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <h1 style={{ display: 'inline-block', marginRight: 16 }}>{station.name}</h1>
                <div className="direction-switch" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <button
                        className={direction === 'up' ? 'active' : ''}
                        onClick={() => setDirection('up')}
                    >
                        上行
                    </button>
                    <button
                        className={direction === 'down' ? 'active' : ''}
                        onClick={() => setDirection('down')}
                    >
                        下行
                    </button>
                </div>
            </div>
            
            <div className="station-content">
                <div className="station-grid">
                    {/* 上部分：站点设施和周边设施 */}
                    <div className="station-top">
                        <div className="info-card">
                            <h2>站点设施</h2>
                            <div className="facilities-list">
                                {station.facilities.map((facility, index) => (
                                    <div key={index} className="facility-item">
                                        <div className="facility-icon">
                                            {facility === "无障碍电梯" && "🛗"}
                                            {facility === "自动扶梯" && "🛗"}
                                            {facility === "卫生间" && "🚻"}
                                            {facility === "便利店" && "🏪"}
                                            {facility === "自动售票机" && "🎫"}
                                        </div>
                                        <div className="facility-info">
                                            <span className="facility-name">{facility}</span>
                                            <span className="facility-status normal">正常使用</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="facilities-note">
                                <p>注：以上设施状态仅供参考，具体以现场实际情况为准</p>
                            </div>
                        </div>

                        <div className="info-card">
                            <h2>周边设施</h2>
                            {placesError && (
                                <div className="error-message">
                                    {placesError}
                                </div>
                            )}
                            {loadingPlaces ? (
                                <div className="loading">加载中...</div>
                            ) : (
                                <div className="nearby-grid">
                                    {(Array.isArray(nearbyPlaces) ? nearbyPlaces : []).map((place, index) => (
                                        <div
                                            key={index}
                                            className="nearby-item"
                                            onClick={placesError ? undefined : () => handlePlaceClick(place)}
                                            style={{ cursor: placesError ? 'not-allowed' : 'pointer', opacity: placesError ? 0.5 : 1 }}
                                        >
                                            <span className="nearby-icon">
                                                {place.type.includes('购物') ? "🏬" :
                                                    place.type.includes('餐饮') ? "🍽️" :
                                                    place.type.includes('景点') ? "🏞️" :
                                                    place.type.includes('文化') ? "🎭" :
                                                    place.type.includes('交通') ? "🚡" : "📍"}
                                            </span>
                                            <div className="nearby-info">
                                                <span className="nearby-name">{place.name}</span>
                                                <span className="nearby-address">
                                                    {place.address && place.address.length > 20
                                                        ? place.address.slice(0, 20) + '...'
                                                        : place.address}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 下部分：进站客流统计和客流态势 */}
                    <div className="station-bottom">
                        <div className="info-card">
                            <div className="chart-header">
                                <h2>进站客流统计（8:00-10:00）</h2>
                            </div>
                            <div className="chart-container">
                                {loading ? (
                                    <div className="loading">数据加载中...</div>
                                ) : error ? (
                                    <div className="error-message">{error}</div>
                                ) : hasTrendData ? (
                                    <ReactEcharts
                                        option={trendOptionMemo}
                                        style={{ height: '100%', width: '100%' }}
                                        opts={{ renderer: 'svg' }}
                                        onEvents={{
                                            'chartready': (e) => {
                                                console.log('图表已准备就绪', e);
                                            },
                                            'error': (e) => {
                                                console.error('图表错误:', e);
                                            }
                                        }}
                                        notMerge={true}
                                        lazyUpdate={true}
                                    />
                                ) : (
                                    <div className="no-data">暂无数据</div>
                                )}
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="chart-header" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <h2>客流态势（8:00-10:00）</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    {tendencyData && tendencyData.data && tendencyData.data.length > 0 && (
                                        <Select
                                            style={{ width: 150 }}
                                            value={selectedTimeIndex}
                                            onChange={setSelectedTimeIndex}
                                            options={tendencyData.data.map((row, index) => {
                                                const startHour = 8;
                                                const startMinute = index * 15;
                                                const endMinute = (index + 1) * 15;
                                                const formatTime = (hour, minute) => {
                                                    const h = hour + Math.floor(minute / 60);
                                                    const m = minute % 60;
                                                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                                };
                                                return {
                                                    label: `${formatTime(startHour, startMinute)}-${formatTime(startHour, endMinute)}`,
                                                    value: index
                                                };
                                            })}
                                        />
                                    )}
                                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                                        态势：{relativeText}
                                    </span>
                                    {/* 新增原始数据按钮 */}
                                    {tendencyData && tendencyData.data && tendencyData.data.length > 0 && (
                                        <Button size="small" onClick={() => { setRawModalOpen(true); fetchRawTendencyData(); }}>
                                            查看原始数据
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="chart-container">
                                {tendencyLoading ? (
                                    <div className="loading">加载中...</div>
                                ) : tendencyError ? (
                                    <div className="error-message">{tendencyError}</div>
                                ) : tendencyData && tendencyData.data && tendencyData.data.length > 0 ? (
                                    renderTendencyTable()
                                ) : (
                                    <div className="no-data">暂无数据</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={showMapModal}
                onCancel={() => {
                    setShowMapModal(false);
                    setSelectedPOI(null);
                    if (modalMap) {
                        modalMap.destroy();
                        setModalMap(null);
                    }
                }}
                footer={null}
                width={1000}
                bodyStyle={{ padding: 0, height: 500 }}
                destroyOnClose={true}
            >
                <div
                    ref={modalMapRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 12,
                        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        background: '#fff'
                    }}
                />
            </Modal>

            {/* 原始数据弹窗 */}
            <Modal
                open={rawModalOpen}
                onCancel={() => setRawModalOpen(false)}
                footer={null}
                width={800}
                title="原始数据列表"
                destroyOnClose={true}
            >
                <Table
                    columns={rawTableColumns}
                    dataSource={rawTendencyData}
                    size="small"
                    loading={rawTendencyLoading}
                    scroll={{ x: true }}
                    pagination={false}
                />
                {rawTendencyError && <div className="error-message">{rawTendencyError}</div>}
            </Modal>
        </div>
    );
};

export default StationInfo; 