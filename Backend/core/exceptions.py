from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

class BaseApplicationException(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    message = "An unexpected error occurred."

    def __init__(self, message=None, details=None):
        if message:
            self.message = message
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(BaseApplicationException):
    status_code = status.HTTP_404_NOT_FOUND
    message = "Resource not found."


class PermissionDeniedException(BaseApplicationException):
    status_code = status.HTTP_403_FORBIDDEN
    message = "You do not have permission to perform this action."


class ValidationException(BaseApplicationException):
    status_code = status.HTTP_400_BAD_REQUEST
    message = "Validation failed."


class AuthenticationException(BaseApplicationException):
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Authentication failed."


def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first to get the standard response
    response = exception_handler(exc, context)

    if isinstance(exc, BaseApplicationException):
        logger.warning(f"Application error raised: {exc.message}. Details: {exc.details}")
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.__class__.__name__,
                    "message": exc.message,
                    "details": exc.details
                }
            },
            status=exc.status_code
        )

    # For standard Django / DRF exceptions caught by the default handler
    if response is not None:
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.__class__.__name__,
                    "message": response.data.get("detail", "Request failed."),
                    "details": response.data
                }
            },
            status=response.status_code
        )

    # Log unexpected server side exceptions
    logger.error("Unhandled server exception", exc_info=exc)
    return Response(
        {
            "success": False,
            "error": {
                "code": "InternalServerError",
                "message": "A critical system error occurred.",
                "details": {}
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
