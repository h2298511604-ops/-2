# app.py - V7.2.0
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from services.amap_client import calculate_commute, search_nearby_refined, regeo_address, get_input_tips
from services.scoring import calculate_rent_income_score, score_hardware, score_house_layout, calculate_location_refined_score

load_dotenv()
app = Flask(__name__)
CORS(app)

@app.route('/api/tips', methods=['POST'])
def input_tips():
    data = request.json
    tips = get_input_tips(data.get('keyword', ''), data.get('city', '南宁'))
    return jsonify([{'name': t.get('name', ''), 'district': t.get('district', '')} for t in tips if t.get('name')])

@app.route('/api/regeo', methods=['POST'])
def get_address_from_coords():
    data = request.json
    return jsonify({'address': regeo_address(data['lng'], data['lat'])})

@app.route('/api/score', methods=['POST'])
def calculate_score():
    try:
        data = request.json
        rental_addr = data['addresses']['rental']
        company_addr = data['addresses']['company']
        city = data.get('city', '南宁')
        
        # 1. 收入租金比
        rent, income = float(data['rent']), float(data['income'])
        income_score = calculate_rent_income_score(rent, income)

        # 2. 通勤时间
        commute_mode = data.get('commute_mode', 'subway')
        commute_data = calculate_commute(rental_addr, company_addr, commute_mode, city)
        if 'error' in commute_data:
            c_score, c_desc = 0.0, f"❌ {commute_data['error']}"
        else:
            mins = commute_data['duration_min']
            c_score = 10.0 if mins <= 20 else 8.5 if mins <= 45 else 7.0 if mins <= 60 else 4.0
            c_desc = f"⏱️ 耗时 {mins}min | 距离 {commute_data['distance_km']}km"

        # 3. 周边配套 (双重扫描逻辑已在 amap_client 封装)
        nearby_raw = search_nearby_refined(rental_addr, city)
        loc_res = calculate_location_refined_score(nearby_raw)

        # 4. 硬件配套
        h_score = score_hardware(data['house_info']['has_bathroom'], data['hardware']['appliances'])
        
        # 5. 户型结构
        layout_res = score_house_layout(data['house_info'])

        total = (income_score * 0.25 + h_score * 0.25 + c_score * 0.20 + loc_res['score'] * 0.20 + layout_res['score'] * 0.10)

        return jsonify({
            'total_score': round(total, 1),
            'details': {
                '收入租金比': {'score': round(income_score, 1), 'desc': f"租金占收入 {(rent/income*100):.1f}%"},
                '硬件配套': {'score': round(h_score, 1), 'desc': "基础家电与卫生间评估"},
                '通勤时间': {'score': round(c_score, 1), 'desc': c_desc},
                '周边配套': loc_res,
                '户型结构': layout_res,
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    # 测试：Cursor Git功能正常