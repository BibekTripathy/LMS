import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class TestAuthFlow:
    
    def test_health_check(self, api_client):
        response = api_client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"status": "ok"}
        
    def test_user_registration(self, api_client):
        url = reverse('register')
        data = {
            "email": "student@example.com",
            "password": "strongpassword123",
            "first_name": "Test",
            "last_name": "Student",
            "role": "ADMIN" # Trying to escalate role
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify user is created with STUDENT role despite payload
        user = User.objects.get(email="student@example.com")
        assert user.role == "STUDENT"
        
    def test_login_and_jwt_generation(self, api_client):
        user = User.objects.create_user(email="test@example.com", password="password")
        url = reverse('login')
        response = api_client.post(url, {"email": "test@example.com", "password": "password"})
        
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_logout_blacklists_token(self, api_client):
        user = User.objects.create_user(email="logout@example.com", password="password")
        
        # Login to get token
        login_response = api_client.post(reverse('login'), {"email": "logout@example.com", "password": "password"})
        refresh_token = login_response.data['refresh']
        access_token = login_response.data['access']
        
        # Logout
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = api_client.post(reverse('logout'), {"refresh": refresh_token})
        assert logout_response.status_code == status.HTTP_205_RESET_CONTENT
        
        # Try to use refresh token again
        refresh_response = api_client.post(reverse('token_refresh'), {"refresh": refresh_token})
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
