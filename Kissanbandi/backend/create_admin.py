import requests
import json

def create_admin():
    url = "https://bogat.onrender.com/api/users/create-first-admin"
    
    headers = {
        "Content-Type": "application/json",
        "x-admin-secret": "kissanbandi_admin_2024_secure"
    }
    
    data = {
        "name": "Admin User",
        "email": "admin@kissanbandi.com",
        "password": "Admin@123",
        "phone": "9876543210"
    }
    
    print("\nMaking request to:", url)
    print("\nHeaders:", json.dumps(headers, indent=2))
    print("\nRequest Body:", json.dumps(data, indent=2))
    
    try:
        print("\nSending request...")
        response = requests.post(url, headers=headers, json=data)
        print("\nStatus Code:", response.status_code)
        print("\nResponse Headers:", json.dumps(dict(response.headers), indent=2))
        print("\nResponse Body:")
        
        try:
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print("Raw response:", response.text)
        
        if response.status_code == 201:
            print("\nAdmin user created successfully!")
            print("You can now login with:")
            print("Email: admin@kissanbandi.com")
            print("Password: Admin@123")
        else:
            print("\nFailed to create admin user")
            print("Status Code:", response.status_code)
            print("Response:", response.text)
            
    except requests.exceptions.RequestException as e:
        print("\nError:", str(e))
        if hasattr(e, 'response'):
            print("Response Status Code:", e.response.status_code)
            print("Response Headers:", json.dumps(dict(e.response.headers), indent=2))
            print("Response Body:", e.response.text)

if __name__ == "__main__":
    print("Creating admin user...")
    create_admin() 