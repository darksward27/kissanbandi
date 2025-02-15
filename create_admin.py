import requests
import json

def create_admin():
    url = "https://kissanbandi.onrender.com/api/users/create-first-admin"
    
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
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print("\nStatus Code:", response.status_code)
        print("\nResponse:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 201:
            print("\nAdmin user created successfully!")
            print("You can now login with:")
            print("Email: admin@kissanbandi.com")
            print("Password: Admin@123")
        else:
            print("\nFailed to create admin user")
            
    except requests.exceptions.RequestException as e:
        print("\nError:", e)

if __name__ == "__main__":
    print("Creating admin user...")
    create_admin() 