# test_key.py（覆盖原文件）
import requests
import os
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

AMAP_KEY = os.getenv('AMAP_API_KEY')

def test_key():
    """测试高德API Key是否有效"""
    print("=" * 50)
    print(f"正在测试Key: {AMAP_KEY[:10]}...")
    print("=" * 50)
    
    # 测试1：检查Key是否为空
    if not AMAP_KEY:
        print("❌ 错误：AMAP_API_KEY 为空！")
        print("请检查 .env 文件是否存在且内容正确")
        return False
    
    # 测试2：调用地理编码API
    url = "https://restapi.amap.com/v3/geocode/geo"
    print(f"\n请求URL: {url}")
    print(f"测试地址: 北京市朝阳区三元桥")
    
    try:
        response = requests.get(url, params={
            'key': AMAP_KEY,
            'address': '北京市朝阳区三元桥'
        }, timeout=5)
        
        print(f"响应状态码: {response.status_code}")
        
        data = response.json()
        print(f"完整响应: {data}")
        
        # 检查高德API返回的状态
        if data.get('status') == '1':
            geocodes = data.get('geocodes')
            if geocodes and len(geocodes) > 0:
                location = geocodes[0].get('location', '未找到坐标')
                print(f"\n✅ 测试成功！坐标: {location}")
                return True
            else:
                print(f"\n❌ 错误：geocodes为空或格式错误")
                print(f"返回数据: {data}")
                return False
        else:
            print(f"\n❌ 高德API返回错误: {data.get('info', '未知错误')}")
            print(f"状态码: {data.get('status')}")
            print(f"详情: {data}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ 请求超时，请检查网络连接")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求异常: {e}")
        return False
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        return False

if __name__ == '__main__':
    test_key()