# services/scoring.py - V7.2.0
import math

def calculate_rent_income_score(rent, income):
    if income <= 0: return 1.0
    r = rent / income
    # PDF Page 1: 严格闭合逻辑
    if r <= 0.15: return 10.0
    elif 0.15 < r <= 0.25: return round(10 - 10 * (r - 0.15), 1)
    elif 0.25 < r <= 0.40: return round(9 - 15 * (r - 0.25), 1)
    elif 0.40 < r <= 0.55: return round(6.5 - 30 * (r - 0.40), 1)
    else: return 1.0

def score_hardware(has_bathroom, appliances):
    score = 1.0
    if appliances.get('空调'): score += 2.0
    if appliances.get('热水器'): score += 2.0
    if appliances.get('洗衣机'): score += 2.0
    if has_bathroom: score += 2.0
    if appliances.get('冰箱'): score += 1.0
    return round(min(10.0, score), 1)

def score_house_layout(info):
    score = 5.0 # 基础分
    floor = info.get('floor', 1)
    has_elevator = info.get('has_elevator', False)
    if has_elevator:
        score += 3.0
        desc = "有电梯，出入便利"
    else:
        if floor <= 2: score += 3.0
        elif floor == 3: score += 2.5
        elif floor == 4: score += 2.0
        elif floor == 5: score += 1.5
        elif floor == 6: score += 1.0
        else: score += 0.5
        desc = f"无电梯且位于 {floor} 楼，搬家困难"
    
    ppl = max(1, info.get('total_people', 1))
    avg_area = info.get('total_area', 20) / ppl
    if avg_area >= 20: score += 2.0
    elif avg_area >= 15: score += 1.5
    elif avg_area >= 10: score += 1.0
    elif avg_area >= 6: score += 0.5
    return {'score': round(min(10.0, score), 1), 'desc': desc}

def calculate_location_refined_score(nearby_data):
    if not nearby_data: return {"score": 5.0, "desc": "周边信息获取异常", "transport": [], "brands": []}
    score = 5.5
    life_total = nearby_data.get('counts', {}).get('life', 0)
    score += min(3.5, life_total * 0.1)
    if nearby_data.get('has_24h'): score += 0.5
    
    # 格式化交通站点展示字符串
    trans = [f"{('🚇' if t['type']=='subway' else '🚌')} {t['name']} ({t['dist']}m)" for t in nearby_data.get('trans_details', [])]
    # 格式化品牌展示字符串
    brands = [f"{b['name']} ({b['dist']}m)" for b in nearby_data.get('brand_list', [])]
    
    return {
        "score": round(min(10.0, score), 1), 
        "desc": f"周边发现 {life_total} 家门店，配套熟度高", 
        "transport": trans, 
        "brands": brands
    }