from apps.audit_logs.models import AuditLog
import json

def log_activity(request, action, payload=None):
    user = request.user if request.user and request.user.is_authenticated else None
    tenant = getattr(request, "tenant", None)
    
    # Extract client IP address
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
        
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    payload_str = json.dumps(payload) if payload else None
    
    AuditLog.objects.create(
        organization=tenant,
        user=user,
        action=action,
        ip_address=ip,
        user_agent=user_agent[:500] if user_agent else None,
        payload=payload_str
    )
