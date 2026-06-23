from celery import shared_task
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_verification_email_task(email: str, token: str):
    logger.info(f"Sending verification email to {email}")
    subject = "Verify your Analytix BI account"
    message = f"Please verify your account by clicking the link below:\n\nhttp://localhost:8000/api/v1/auth/verify-email/?token={token}"
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email="noreply@analytix.bi",
            recipient_list=[email],
            fail_silently=False
        )
        logger.info(f"Verification email successfully sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {str(e)}")


@shared_task
def send_password_reset_email_task(email: str, token: str):
    logger.info(f"Sending password reset email to {email}")
    subject = "Reset your Analytix BI password"
    message = f"Please reset your password by using the reset token below:\n\nToken: {token}"
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email="noreply@analytix.bi",
            recipient_list=[email],
            fail_silently=False
        )
        logger.info(f"Password reset email successfully sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")

