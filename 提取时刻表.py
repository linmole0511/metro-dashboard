import pandas as pd
import json
from datetime import datetime

station_id_to_name = {
    "102": "小什字",
    "103": "较场口",
    "104": "七星岗",
    "318": "两路口",
    "106": "鹅岭",
    "107": "大坪",
    "108": "石油路",
    "109": "歇台子",
    "110": "石桥铺",
    "111": "高庙村",
    "112": "马家岩",
    "113": "小龙坎",
    "114": "沙坪坝",
    "115": "杨公桥",
    "116": "烈士墓",
    "117": "磁器口",
    "118": "石井坡",
    "119": "双碑",
    "120": "赖家桥",
    "121": "微电园",
    "122": "陈家桥",
    "123": "大学城",
    "124": "尖顶坡",
    
}

def extract_station_times(timetable_path, id_to_name):
    df = pd.read_csv(timetable_path)
    station_cols = [col for col in df.columns if '_Arrival' in col]
    station_ids = [col.replace('_Arrival', '') for col in station_cols]

    result = {}
    for station_id, arr_col in zip(station_ids, station_cols):
        station = id_to_name.get(station_id, station_id)
        times = df[arr_col].dropna().tolist()
        times = [t for t in times if isinstance(t, str) and len(t.split(':')) == 3]
        times_dt = [datetime.strptime(t, "%H:%M:%S") for t in times]
        if times_dt:
            first = min(times_dt).strftime("%H:%M:%S")
            last = max(times_dt).strftime("%H:%M:%S")
            all_times = sorted([t.strftime("%H:%M:%S") for t in times_dt])
        else:
            first = last = None
            all_times = []
        result[station] = {
            "first_train": first,
            "last_train": last,
            "all_arrival_times": all_times
        }
    return result

# 下行
down = extract_station_times('Line_1_Timetable_down_46.csv', station_id_to_name)
# 上行
up = extract_station_times('Line_1_Timetable_up_46.csv', station_id_to_name)

# 合并输出
output = {
    "down": down,
    "up": up
}

# 保存为json，供前端调用
with open('timetable_processed.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("数据已处理并输出为 timetable_processed.json")