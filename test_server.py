import requests

def test_server():
    try:
        # 測試基本健康檢查
        response = requests.get('http://localhost:5000/')
        print(f"健康檢查狀態碼: {response.status_code}")
        print(f"健康檢查響應: {response.text}")
        
        # 測試OPTIONS請求
        response = requests.options('http://localhost:5000/api/students/clear-camps')
        print(f"OPTIONS請求狀態碼: {response.status_code}")
        print(f"OPTIONS響應頭: {dict(response.headers)}")
        
        # 測試POST請求
        response = requests.post('http://localhost:5000/api/students/clear-camps')
        print(f"POST請求狀態碼: {response.status_code}")
        print(f"POST響應: {response.text}")
        
    except Exception as e:
        print(f"錯誤: {e}")

if __name__ == "__main__":
    test_server()
