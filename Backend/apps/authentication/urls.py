from django.urls import path
from apps.authentication.views import (
    RegisterView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    SSOAuthorizeView,
    SSOCallbackView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="auth_login"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="auth_refresh"),
    path("verify-email/", VerifyEmailView.as_view(), name="auth_verify_email"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth_forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth_reset_password"),
    path("sso/authorize/", SSOAuthorizeView.as_view(), name="auth_sso_authorize"),
    path("sso/callback/", SSOCallbackView.as_view(), name="auth_sso_callback"),
]
