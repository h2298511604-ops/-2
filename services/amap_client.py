# services/amap_client.py – V7.2.0-hotfix1  强制刷新+调试
import requests
import os
from dotenv import load_dotenv

load_dotenv()
AMAP_KEY = os.getenv('AMAP_API_KEY')

FAMOUS_BRANDS = [
    '星巴克', '瑞幸', '库迪', '喜茶', '霸王茶姬', '奈雪', '蜜雪冰城',
    '茶百道', '古茗', '一点点', '塔斯汀', '麦当劳', '肯德基', '必胜客',
    '海底捞', '老乡鸡', '7-Eleven', '全家', '罗森', '沃尔玛'
]

DEBUG_REFRESH = True   # 验收后改 False


# ---------- 以下函数无改动 ----------
def get_input_tips(keyword, city):
    try:
        params = {'key': AMAP_KEY, 'keywords': keyword, 'city': city, 'citylimit': 'true'}
        resp = requests.get("https://restapi.amap.com/v3/assistant/inputtips",
                            params=params, timeout=5).json()
        return [t for t in resp.get('tips', []) if t.get('location')]
    except Exception:
        return []


def geocode_address(address, city=None):
    if ',' in str(address) and address.replace('.', '').replace(',', '').isdigit():
        p = str(address).split(',')
        return {'lng': p[0], 'lat': p[1]}
    try:
        params = {'key': AMAP_KEY, 'address': address}
        if city:
            params['city'] = city
        data = requests.get("https://restapi.amap.com/v3/geocode/geo",
                            params=params, timeout=5).json()
        if data['status'] == '1' and data['geocodes']:
            loc = data['geocodes'][0]['location'].split(',')
            return {'lng': loc[0], 'lat': loc[1]}
    except Exception:
        pass
    return None


# ---------- 核心：强制重新扫描 ----------
def search_nearby_refined(address, city=None):
    loc = geocode_address(address, city)
    if not loc:
        return None
    l_s = f"{loc['lng']},{loc['lat']}"

    # 每次重置，禁止缓存
    summary = {'counts': {'life': 0}, 'brand_list': [],
               'trans_details': [], 'has_24h': False}

    # Pass 1 生活设施总量
    try:
        r = requests.get("https://restapi.amap.com/v3/place/around", params={
            'key': AMAP_KEY, 'location': l_s, 'types': '050000|060000|070000',
            'radius': 800, 'offset': 50, 'sortrule': 'distance'
        }, timeout=10).json()
        if r['status'] == '1':
            summary['counts']['life'] = int(r.get('count', 0))
            for p in r.get('pois', []):
                if '24小时' in p['name'] or '24h' in p['name'].lower():
                    summary['has_24h'] = True
    except Exception:
        pass

    # Pass 2 品牌循环
    b_map = {}
    for brand_kw in FAMOUS_BRANDS:
        try:
            r = requests.get("https://restapi.amap.com/v3/place/around", params={
                'key': AMAP_KEY, 'location': l_s, 'keywords': brand_kw,
                'radius': 1000, 'offset': 5, 'sortrule': 'distance'
            }, timeout=3).json()
            if r['status'] == '1' and int(r.get('count', 0)) > 0:
                for p in r.get('pois', []):
                    if brand_kw in p['name']:
                        dist = int(p['distance'])
                        if brand_kw not in b_map or dist < b_map[brand_kw]['dist']:
                            b_map[brand_kw] = {'name': p['name'], 'dist': dist}
        except Exception:
            continue
    summary['brand_list'] = sorted(b_map.values(), key=lambda x: x['dist'])

    # 交通
    transport_list = []
    for cat, kw in {'subway': '地铁站', 'bus': '公交车站'}.items():
        try:
            r = requests.get("https://restapi.amap.com/v3/place/around", params={
                'key': AMAP_KEY, 'location': l_s, 'keywords': kw,
                'radius': 1000, 'offset': 10, 'sortrule': 'distance'
            }, timeout=5).json()
            if r['status'] == '1':
                for p in r.get('pois', []):
                    transport_list.append(
                        {'type': cat, 'name': p['name'], 'dist': int(p['distance'])})
        except Exception:
            pass
    summary['trans_details'] = sorted(
        transport_list, key=lambda x: (0 if x['type'] == 'subway' else 1, x['dist']))

    if DEBUG_REFRESH:
        print(f'[DEBUG] address={address} life_total={summary["counts"]["life"]} '
              f'brands={len(summary["brand_list"])}')
    return summary


def calculate_commute(rental_addr, company_addr, mode, city):
    origin = geocode_address(rental_addr, city)
    dest = geocode_address(company_addr, city)
    if not origin or not dest:
        return {'error': '坐标解析失败'}
    o_s = f"{origin['lng']},{origin['lat']}"
    d_s = f"{dest['lng']},{dest['lat']}"

    url_map = {
        'subway': 'https://restapi.amap.com/v3/direction/transit/integrated',
        'bus': 'https://restapi.amap.com/v3/direction/transit/integrated',
        'walking': 'https://restapi.amap.com/v3/direction/walking',
        'cycling': 'https://restapi.amap.com/v4/direction/bicycling',
        'driving': 'https://restapi.amap.com/v3/direction/driving'
    }
    url = url_map.get(mode, url_map['subway'])
    try:
        params = {'key': AMAP_KEY, 'origin': o_s, 'destination': d_s}
        if 'transit' in url:
            params['city'] = city
        r = requests.get(url, params=params, timeout=10).json()
        route = r.get('route') or r.get('data')
        path = (route['transits'][0] if 'transits' in route and route['transits']
                else route['paths'][0])
        return {'duration_min': int(path['duration']) // 60,
                'distance_km': round(int(path['distance']) / 1000, 1)}
    except Exception:
        return {'error': '规划请求超时'}


def regeo_address(lng, lat):
    try:
        r = requests.get("https://restapi.amap.com/v3/geocode/regeo",
                         params={'key': AMAP_KEY, 'location': f"{lng},{lat}"},
                         timeout=5).json()
        return r['regeocode']['formatted_address'] if r['status'] == '1' else None
    except Exception:
        return None