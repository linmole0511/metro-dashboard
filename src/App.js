import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import StationInfo from './components/StationInfo';
import './App.css';

function MapComponent() {
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const [map, setMap] = useState(null);
    const [error, setError] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [scheduleData, setScheduleData] = useState(null);
    const [direction, setDirection] = useState('up');
    const [crowdingLevel, setCrowdingLevel] = useState('normal');
    const [enableMapNavigation, setEnableMapNavigation] = useState(false);
    const [mapTheme, setMapTheme] = useState('fresh');
    const enableMapNavigationRef = useRef(enableMapNavigation);
    const mapContainerRef = useRef(null);
    const [crowdingData, setCrowdingData] = useState(null);

    // 拥挤度图标
    const crowdingIcons = {
        crowded: '/crowded-icon.png',
        busy: '/busy-icon.png',
        normal: '/normal-icon.png'
    };

    // 使用 useMemo 包装站点编号映射
    const stationCodeMap = useMemo(() => ({
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
        "陈家桥": "S22",
        "大学城": "S23",
        "尖顶坡": "S24",
        "璧山": "S25"
    }), []);

    // 使用 useMemo 包装换乘站数组
    const transferStations = useMemo(() => [
        "大坪", "两路口", "较场口", "小什字", "沙坪坝", "小龙坎", "石桥铺", "歇台子", "七星岗"
    ], []);

    // 将 handleStationClick 移到前面并使用 useCallback 包装
    const handleStationClick = useCallback((station) => {
        if (!station) {
            console.warn('站点数据为空');
            return;
        }

        setSelectedStation(station);
        console.log('selectedStation.name:', station.name);
        
        if (!scheduleData) {
            console.warn('时刻表数据未加载完成');
            return;
        }

        // 检查站点数据是否存在
        if (!scheduleData.down || !scheduleData.down[station.name]) {
            console.warn(`站点 ${station.name} 的时刻表数据不存在`);
            return;
        }

        console.log('站点时刻表数据:', scheduleData.down[station.name]);
    }, [scheduleData]);

    // 加载拥挤度数据
    useEffect(() => {
        const fetchCrowdingData = async () => {
            try {
                console.log('开始加载拥挤度数据...');
                // 加载上行数据
                const upResponse = await fetch('/上行每站每15分钟平均离站拥挤度.csv');
                const upText = await upResponse.text();
                const upRows = upText.split('\n').slice(1); // 跳过标题行
                const upData = {};
                
                upRows.forEach(row => {
                    if (!row.trim()) return;
                    const [station, timeWindow, crowding, walkTime, platformCrowding] = row.split(',');
                    if (!upData[station]) {
                        upData[station] = {};
                    }
                    upData[station][timeWindow] = {
                        crowding: parseFloat(crowding),
                        walkTime: parseInt(walkTime) || 0,
                        platformCrowding: parseFloat(platformCrowding) || 0
                    };
                });

                // 加载下行数据
                const downResponse = await fetch('/下行每站每15分钟平均离站拥挤度.csv');
                const downText = await downResponse.text();
                const downRows = downText.split('\n').slice(1); // 跳过标题行
                const downData = {};
                
                downRows.forEach(row => {
                    if (!row.trim()) return;
                    const [station, timeWindow, crowding, walkTime, platformCrowding] = row.split(',');
                    if (!downData[station]) {
                        downData[station] = {};
                    }
                    downData[station][timeWindow] = {
                        crowding: parseFloat(crowding),
                        walkTime: parseInt(walkTime) || 0,
                        platformCrowding: parseFloat(platformCrowding) || 0
                    };
                });
                
                console.log('拥挤度数据加载成功:', { upData, downData });
                setCrowdingData({ up: upData, down: downData });
            } catch (err) {
                console.error('加载拥挤度数据失败:', err);
            }
        };

        fetchCrowdingData();
    }, []);

    // 判断是否为工作日
    const isWorkday = () => {
        const now = new Date();
        const day = now.getDay();
        // 0是周日，6是周六
        return day !== 0 && day !== 6;
    };

    // 根据拥挤度百分比确定拥挤等级
    const getCrowdingLevelFromPercentage = (percentage) => {
        console.log('当前拥挤度百分比:', percentage);
        if (percentage >= 70) return 'crowded';
        if (percentage >= 40) return 'busy';
        return 'normal';
    };

    // 模拟客流数据更新
    useEffect(() => {
        const updateCrowdingLevel = () => {
            if (!crowdingData || !selectedStation) return;

            const stationCode = stationCodeMap[selectedStation.name];
            if (!stationCode) {
                console.log('未找到站点编号:', selectedStation.name);
                return;
            }

            const currentTimeWindow = getCurrentTimeWindow();
            // 根据方向选择对应的数据
            const directionData = direction === 'up' ? crowdingData.up : crowdingData.down;
            const stationData = directionData[stationCode];

            if (!stationData || !stationData[currentTimeWindow]) {
                console.log('未找到当前时间窗口数据:', {
                    station: selectedStation.name,
                    stationCode,
                    timeWindow: currentTimeWindow,
                    direction
                });
                // 使用基础判断
                const hour = now.getHours();
                const minute = now.getMinutes();
                const timeValue = hour + minute / 60;
                
                let baseLevel = 'normal';
                
                // 根据工作日/休息日调整判断标准
                if (isWorkday()) {
                    // 工作日判断标准
                    // 拥挤时段：早高峰7:30-9:30，晚高峰17:30-19:00
                    if ((timeValue >= 7.5 && timeValue <= 9.5) || (timeValue >= 17.5 && timeValue <= 19)) {
                        baseLevel = 'crowded';
                    }
                    // 较忙时段：早高峰7:00-10:00，晚高峰17:00-19:30
                    else if ((timeValue >= 7 && timeValue <= 10) || (timeValue >= 17 && timeValue <= 19.5)) {
                        baseLevel = 'busy';
                    }
                } else {
                    // 休息日判断标准
                    // 拥挤时段：早高峰8:30-9:30，晚高峰18:30-19:30
                    if ((timeValue >= 8.5 && timeValue <= 9.5) || (timeValue >= 18.5 && timeValue <= 19.5)) {
                        baseLevel = 'crowded';
                    }
                    // 较忙时段：早高峰8:00-10:00，晚高峰18:00-20:00
                    else if ((timeValue >= 8 && timeValue <= 10) || (timeValue >= 18 && timeValue <= 20)) {
                        baseLevel = 'busy';
                    }
                }
                
                // 换乘站提升一个等级
                if (transferStations.includes(selectedStation.name)) {
                    if (baseLevel === 'normal') baseLevel = 'busy';
                    else if (baseLevel === 'busy') baseLevel = 'crowded';
                }
                
                console.log('使用基础判断的拥挤度:', baseLevel);
                setCrowdingLevel(baseLevel);
                return;
            }

            // 使用实际数据
            const crowding = stationData[currentTimeWindow].crowding;
            let level = getCrowdingLevelFromPercentage(crowding);

            // 换乘站提升一个等级
            if (transferStations.includes(selectedStation.name)) {
                if (level === 'normal') level = 'busy';
                else if (level === 'busy') level = 'crowded';
            }

            console.log('最终拥挤度等级:', level);
            setCrowdingLevel(level);
        };

        // 根据时间段动态调整更新频率
        const getUpdateInterval = () => {
            const hour = now.getHours();
            const minute = now.getMinutes();
            const timeValue = hour + minute / 60;

            // 高峰时段更新更频繁
            if ((timeValue >= 7 && timeValue <= 10) || (timeValue >= 17 && timeValue <= 19)) {
                return 30000; // 30秒
            } else if ((timeValue >= 6.5 && timeValue <= 10) || (timeValue >= 16.5 && timeValue <= 20)) {
                return 45000; // 45秒
            }
            return 60000; // 1分钟
        };

        updateCrowdingLevel();
        const timer = setInterval(updateCrowdingLevel, getUpdateInterval());
        return () => clearInterval(timer);
    }, [now, selectedStation, crowdingData, direction, stationCodeMap, transferStations]);

    useEffect(() => {
        const fetchScheduleData = async () => {
            try {
                console.log('开始加载时刻表数据...');
                const response = await fetch('/timetable_processed.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch schedule data: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                console.log('时刻表数据加载成功:', data);
                setScheduleData(data);
            } catch (err) {
                console.error('加载时刻表数据失败:', err);
                setError('时刻表数据加载失败，请刷新页面重试');
            }
        };

        fetchScheduleData();
    }, []);

    useEffect(() => {
        if (!map && mapContainerRef.current) {
            AMapLoader.load({
                key: 'f47b354d20162e8c045cf6974165d0f0',
                version: '2.0',
                plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.ControlBar'],
            }).then((AMap) => {
                try {
                    console.log('开始初始化地图');
                    const newMap = new AMap.Map(mapContainerRef.current, {
                        center: [106.551643, 29.563761],
                        zoom: 15,
                        viewMode: '3D',
                        pitch: 75,
                        mapStyle: 'amap://styles/fresh',
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
                    newMap.addControl(new AMap.ToolBar({
                        position: 'RB'
                    }));
                    newMap.addControl(new AMap.ControlBar({
                        position: {
                            right: '10px',
                            top: '10px'
                        }
                    }));

                    // 加载平滑线路数据
                    fetch('/data/smooth_line_points.json')
                        .then(response => response.json())
                        .then(smoothPoints => {
                            // 创建平滑的地铁线路
                            const smoothPath = smoothPoints.map(point => [point.lng, point.lat]);
                            const smoothPolyline = new AMap.Polyline({
                                path: smoothPath,
                                strokeColor: "#0091ff",
                                strokeWeight: 4,
                                strokeOpacity: 0.7,
                                zIndex: 50,
                                strokeStyle: "solid",
                                lineJoin: 'round',
                                lineCap: 'round',
                                showDir: true
                            });
                            smoothPolyline.setMap(newMap);
                        })
                        .catch(error => console.error('加载平滑线路数据失败:', error));

                    const line1Stations = [
                        { name: "朝天门", lng: 106.585845, lat: 29.564142 },
                        { name: "小什字", lng: 106.583593, lat: 29.560028 },
                        { name: "较场口", lng: 106.574352, lat: 29.553575 },
                        { name: "七星岗", lng: 106.56291, lat: 29.554914 },
                        { name: "两路口", lng: 106.54938, lat: 29.552478 },
                        { name: "鹅岭", lng: 106.533923, lat: 29.547986 },
                        {"name": "大坪", "lng": 106.51845396, "lat": 29.54068085},
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

                    // 创建站点标记
                    line1Stations.forEach(station => {
                        const isTransfer = transferStations.includes(station.name);
                        const markerContent = document.createElement('div');
                        markerContent.className = 'custom-bubble-marker';
                        markerContent.innerHTML = `
                            <div class="bubble-circle"></div>
                            <div class="bubble-label">${station.name}${isTransfer ? '（换乘）' : ''}</div>
                        `;

                        const marker = new AMap.Marker({
                            position: [station.lng, station.lat],
                            content: markerContent,
                            anchor: 'bottom-center',
                            offset: new AMap.Pixel(0, 0),
                            clickable: true,  // 确保这个属性存在
                            bubble: false     // 确保这个属性存在
                        });

                        // 更新点击事件处理
                        const handleClick = (e) => {
                            console.log('handleClick 被触发, enableMapNavigation:', enableMapNavigationRef.current);
                            if (enableMapNavigationRef.current) {
                                const aMapUrl = `https://uri.amap.com/marker?position=${station.lng},${station.lat}&name=${station.name}&src=myapp&coordinate=gaode&callnative=0`;
                                window.open(aMapUrl, '_blank');
                            }
                            handleStationClick(station);
                        };

                        // 为整个标记添加点击事件
                        marker.on('click', handleClick);
                        
                        // 鼠标悬停效果
                        const updateStyles = (isHover) => {
                            const circle = markerContent.querySelector('.bubble-circle');
                            const label = markerContent.querySelector('.bubble-label');
                            
                            if (isHover) {
                                circle.style.background = '#ff4d4f';
                                label.style.background = '#ff4d4f';
                                label.style.color = '#fff';
                            } else {
                                circle.style.background = '#ff4d4f';
                                label.style.background = 'rgba(255,255,255,0.9)';
                                label.style.color = '#333';
                            }
                        };

                        marker.on('mouseover', () => updateStyles(true));
                        marker.on('mouseout', () => updateStyles(false));

                        marker.setMap(newMap);
                    });

                    // 等待地图加载完成
                    newMap.on('complete', () => {
                        console.log('地图加载完成');
                        setMap(newMap);

                        // 移除这里的 click 事件绑定，改为在 useEffect 里绑定
                        newMap.on('error', (e) => {
                            console.error('地图加载错误:', e);
                            setError(e.message);
                        });
                    });

                } catch (err) {
                    console.error('地图初始化错误:', err);
                    setError(err.message);
                }
            }).catch(err => {
                console.error('AMap 加载错误:', err);
                setError(err.message);
            });
        }
    }, [map, navigate, enableMapNavigation, handleStationClick, transferStations]);

    // 新增：地图 click 事件绑定，依赖 map 和 enableMapNavigation
    useEffect(() => {
        if (!map) return;

        const handleMapClick = (e) => {
            console.log('地图点击事件触发，导航状态:', enableMapNavigationRef.current);
            if (!enableMapNavigation) {
                console.log('地图导航未启用，不执行跳转');
                return;
            }
            // 检查是否点击到标记
            const overlays = map.getAllOverlays('marker');
            const clickedOnMarker = overlays.some(marker => {
                const markerPosition = marker.getPosition();
                const clickPosition = e.lnglat;
                const distance = Math.sqrt(
                    Math.pow(markerPosition.getLng() - clickPosition.getLng(), 2) +
                    Math.pow(markerPosition.getLat() - clickPosition.getLat(), 2)
                );
                return distance < 0.0001;
            });

            if (!clickedOnMarker) {
                console.log('执行地图跳转');
                const { lng, lat } = e.lnglat;
                const aMapUrl = `https://uri.amap.com/marker?position=${lng},${lat}&name=当前位置&src=myapp&coordinate=gaode&callnative=0`;
                window.open(aMapUrl, '_blank');
            } else {
                console.log('点击到标记，不执行跳转');
            }
        };

        map.off('click', handleMapClick);  // 先解绑
        map.on('click', handleMapClick);   // 再绑定

        return () => {
            map.off('click', handleMapClick);
        };
    }, [map, enableMapNavigation]);

    useEffect(() => {
        enableMapNavigationRef.current = enableMapNavigation;
    }, [enableMapNavigation]);

    const getCrowdingColor = (level) => {
        switch (level) {
            case 'crowded': return '#ff4d4f';
            case 'busy': return '#faad14';
            case 'normal': return '#52c41a';
            default: return '#52c41a';
        }
    };

    const getCrowdingText = (level) => {
        switch (level) {
            case 'crowded': return '拥挤';
            case 'busy': return '较忙';
            case 'normal': return '舒适';
            default: return '舒适';
        }
    };

    const currentSchedule = selectedStation && scheduleData ? 
        (direction === 'up' ? scheduleData.up?.[selectedStation.name] : scheduleData.down?.[selectedStation.name]) : null;

    // 获取下一班车信息
    const getNextTrain = (schedule) => {
        if (!schedule || !schedule.all_arrival_times) return null;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // 判断是否已超过末班车时间
        const lastTrainTime = schedule.last_train.split(':').map(Number);
        const lastTrainMinutes = lastTrainTime[0] * 60 + lastTrainTime[1];
        if (currentTime > lastTrainMinutes) {
            return { time: null, countdown: null, isEndOfService: true };
        }
        
        const nextTime = schedule.all_arrival_times.find(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const trainTime = hours * 60 + minutes;
            return trainTime > currentTime;
        });

        if (!nextTime) return null;

        const [hours, minutes] = nextTime.split(':').map(Number);
        const trainTime = hours * 60 + minutes;
        const countdown = trainTime - currentTime;

        return {
            time: nextTime,
            countdown: countdown,
            crowding: 'normal' // 默认拥挤度
        };
    };

    // 获取当前时间窗口
    const getCurrentTimeWindow = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // 确定15分钟区间
        let startMinute = Math.floor(minute / 15) * 15;
        let endMinute = startMinute + 15;
        
        // 处理小时进位
        let endHour = hour;
        if (endMinute === 60) {
            endMinute = 0;
            endHour = hour + 1;
        }
        
        // 格式化时间，确保两位数
        const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const timeWindow = `${formatTime(hour, startMinute)}-${formatTime(endHour, endMinute)}`;
        console.log('当前时间窗口:', timeWindow);
        return timeWindow;
    };

    // 终点站定义
    const upDirectionEnd = "朝天门";
    const downDirectionEnd = "璧山";
    const directionEnd = direction === 'up' ? upDirectionEnd : downDirectionEnd;

    // 添加主题切换函数
    const handleThemeChange = (theme) => {
        setMapTheme(theme);
        if (map) {
            map.setMapStyle(`amap://styles/${theme}`);
        }
    };

    // 动态更新时间，每秒刷新一次
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    console.log('MapComponent 渲染', { error, map, selectedStation });

    return (
        <div className="dashboard">
            <div ref={mapContainerRef} id="map-container" className="map-bg"></div>
            <div className="map-navigation-toggle-floating">
                <label className="switch">
                    <input 
                        type="checkbox" 
                        checked={enableMapNavigation}
                        onChange={(e) => {
                            console.log('切换地图导航', e.target.checked);
                            setEnableMapNavigation(e.target.checked);
                        }}
                    />
                    <span className="slider round"></span>
                </label>
                <span className="toggle-label">地图导航</span>
            </div>
            {/* 添加主题切换按钮组 */}
            <div className="theme-switch-container">
                <button 
                    className={`theme-btn ${mapTheme === 'fresh' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('fresh')}
                >
                    清新主题
                </button>
                <button 
                    className={`theme-btn ${mapTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                >
                    暗色主题
                </button>
            </div>
            <header className="dashboard-header">
                <div className="dashboard-title">线路客流态势可视化</div>
                <div className="dashboard-controls">
                    {/* <div className="dashboard-time">
                        {now.toLocaleString('zh-CN', { hour12: false })}
                    </div> */}
                </div>
            </header>
            <div className="dashboard-main">
                <aside className="dashboard-right card">
                    <div>右侧测试内容</div>
                    <h2>线路信息</h2>
                    <div className="line-info">
                        <div className="info-item">
                            <span className="label">线路名称：</span>
                            <span className="value">重庆1号线</span>
                        </div>
                        <div className="info-item">
                            <span className="label">运营时间：</span>
                            <span className="value">06:30-23:25</span>
                        </div>
                        <div className="info-item">
                            <span className="label">上行终点：</span>
                            <span className="value">朝天门</span>
                        </div>
                        <div className="info-item">
                            <span className="label">下行终点：</span>
                            <span className="value">璧山</span>
                        </div>
                    </div>
                    <h2>运营状态</h2>
                    <div className="operation-status">
                        <div className="status-item normal">
                            <span className="status-dot"></span>
                            <span className="status-text">正常运营</span>
                        </div>
                        <div className="status-item">
                            <span className="status-text">当前时间：{now.toLocaleTimeString('zh-CN', { hour12: false })}</span>
                        </div>
                    </div>
                    <h2>高峰时段</h2>
                    <div className="peak-hours">
                        <div className="peak-item">
                            <span className="peak-label">早高峰</span>
                            <span className="peak-time">07:00-10:00</span>
                        </div>
                        <div className="peak-item">
                            <span className="peak-label">晚高峰</span>
                            <span className="peak-time">17:00-19:00</span>
                        </div>
                    </div>
                </aside>
                <aside className="dashboard-left card">
                    <div>左侧测试内容</div>
                    {selectedStation ? (
                        <>
                            <div className="station-header">
                                <h2>{selectedStation.name}站</h2>
                                <div className="direction-switch">
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
                            {/* 开往 XX */}
                            <div className="station-direction">
                                开往 <b>{directionEnd}</b>
                            </div>
                            {/* 当前拥挤程度 */}
                            <div className="station-status">
                                <div className="status-indicator">
                                    <span className="status-dot" style={{ background: getCrowdingColor(crowdingLevel) }}></span>
                                    <span className="status-text">
                                        {getCrowdingText(crowdingLevel)}
                                        <img
                                            src={crowdingIcons[crowdingLevel]}
                                            alt={getCrowdingText(crowdingLevel)}
                                            className="crowding-icon"
                                        />
                                    </span>
                                </div>
                            </div>
                            {currentSchedule ? (
                                <div className="schedule-info">
                                    <div className="schedule-item">
                                        <span className="label">首班车：</span>
                                        <span className="value">{currentSchedule.first_train}</span>
                                    </div>
                                    <div className="schedule-item">
                                        <span className="label">末班车：</span>
                                        <span className="value">{currentSchedule.last_train}</span>
                                    </div>
                                    {getNextTrain(currentSchedule) && !getNextTrain(currentSchedule).isEndOfService && (
                                        <div className="schedule-item next-train">
                                            <span className="label">下一班：</span>
                                            <span className="value">{getNextTrain(currentSchedule).time}</span>
                                            <span className="countdown">还有 {getNextTrain(currentSchedule).countdown} 分钟</span>
                                        </div>
                                    )}
                                    {getNextTrain(currentSchedule) && getNextTrain(currentSchedule).isEndOfService && (
                                        <div className="schedule-item end-of-service">
                                            <span className="value">今日运营结束</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-schedule">暂无时刻表数据</div>
                            )}
                            <div className="station-actions">
                                <button 
                                    className="view-details-btn"
                                    onClick={() => {
                                        if (selectedStation) {
                                            console.log('导航到站点详情页:', selectedStation.name);
                                            navigate(`/station/${encodeURIComponent(selectedStation.name)}`);
                                        } else {
                                            console.warn('未选择站点，无法查看详情');
                                        }
                                    }}
                                >
                                    查看详情
                                </button>
                                <button 
                                    className="refresh-btn"
                                    onClick={() => {
                                        if (selectedStation) {
                                            setSelectedStation(null);
                                            setTimeout(() => setSelectedStation(selectedStation), 100);
                                        }
                                    }}
                                >
                                    刷新数据
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-station-selected">
                            <h2>请选择站点</h2>
                            <p>点击地图上的站点标记查看时刻表信息</p>
                            <div className="crowding-legend">
                                <div className="legend-item">
                                    <span className="legend-dot" style={{ background: getCrowdingColor('normal') }}></span>
                                    <span>舒适</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot" style={{ background: getCrowdingColor('busy') }}></span>
                                    <span>较忙</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-dot" style={{ background: getCrowdingColor('crowded') }}></span>
                                    <span>拥挤</span>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MapComponent />} />
                <Route path="/station/:stationName" element={<StationInfo />} />
            </Routes>
        </Router>
    );
}

export default App; 

