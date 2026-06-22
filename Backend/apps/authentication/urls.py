from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.authentication.views import (
    RegisterView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    CustomTokenObtainPairView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="auth_login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth_refresh"),
    path("verify-email/", VerifyEmailView.as_view(), name="auth_verify_email"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth_forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth_reset_password"),
]
