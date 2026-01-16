import requests

# 测试完整评分接口
url = "http://127.0.0.1:5000/api/score"
data = {
    "rent": 3500,
    "income": 10000,
    "addresses": {
        "rental": "北京市朝阳区三元桥",
        "company": "北京市海淀区中关村"
    },
    "house_info": {
        "total_people": 2,
        "total_area": 70,
        "has_bathroom": True,
        "floor": 5,
        "has_elevator": False,
        "orientation": "东南"
    },
    "hardware": {
        "appliances": {
            "洗衣机": True,
            "热水器": True,
            "空调": True,
            "冰箱": False,
            "燃气灶": True
        }
    }
}

try:
    response = requests.post(url, json=data)
    print("状态码:", response.status_code)
    print("返回结果:", response.json())
except Exception as e:
    print("请求失败，请检查后端是否启动:", e)