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
        
    @pytest.mark.parametrize('password', ['short1', 'password', '12345678901', 'reg-test@example.com'])
    def test_registration_rejects_weak_passwords(self, api_client, password):
        response = api_client.post(reverse('register'), {"email": "reg-test@example.com", "password": password})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['code'] == 'WEAK_PASSWORD'
        assert not User.objects.filter(email="reg-test@example.com").exists()

    def test_registration_rejects_invalid_and_duplicate_emails(self, api_client):
        bad = api_client.post(reverse('register'), {"email": "not-an-email", "password": "Sturdy-Pass-2026"})
        assert bad.status_code == status.HTTP_400_BAD_REQUEST
        User.objects.create_user(email="taken@example.com", password="Sturdy-Pass-2026")
        dup = api_client.post(reverse('register'), {"email": "TAKEN@example.com", "password": "Sturdy-Pass-2026"})
        assert dup.status_code == status.HTTP_400_BAD_REQUEST

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

    def test_profile_retrieval_and_update(self, api_client):
        user = User.objects.create_user(
            email="profile@example.com",
            password="password",
            first_name="Jane",
            last_name="Doe"
        )
        api_client.force_authenticate(user=user)

        # GET /api/v1/users/me/
        get_res = api_client.get('/api/v1/users/me/')
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.data['email'] == "profile@example.com"
        assert get_res.data['first_name'] == "Jane"

        # GET /api/v1/auth/me/
        auth_me_res = api_client.get('/api/v1/auth/me/')
        assert auth_me_res.status_code == status.HTTP_200_OK

        # PATCH /api/v1/users/me/
        patch_res = api_client.patch('/api/v1/users/me/', {
            "first_name": "Janet",
            "last_name": "Smith",
            "role": "ADMIN" # Attempt role escalation
        })
        assert patch_res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.first_name == "Janet"
        assert user.last_name == "Smith"
        assert user.role == "STUDENT" # Role escalation rejected
