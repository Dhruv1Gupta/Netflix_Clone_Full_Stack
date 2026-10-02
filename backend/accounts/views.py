from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import (
    LoginSerializer,
    SignupSerializer,
    UserSerializer,
    tokens_for_user,
)

_session_response = inline_serializer(
    name="AuthSession",
    fields={
        "user": UserSerializer(),
        "tokens": inline_serializer(
            name="AuthTokens",
            fields={"access": serializers.CharField(), "refresh": serializers.CharField()},
        ),
    },
)


class AuthThrottledView(APIView):
    """Auth endpoints share a tighter, scoped rate limit (see settings)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "auth"

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle

        return [ScopedRateThrottle()]


class SignupView(AuthThrottledView):
    @extend_schema(request=SignupSerializer, responses={201: _session_response}, tags=["Auth"])
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(AuthThrottledView):
    @extend_schema(request=LoginSerializer, responses={200: _session_response}, tags=["Auth"])
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            # Bad credentials -> 401 with {"detail": "..."}; malformed input -> 400.
            if "detail" in serializer.errors:
                return Response(
                    {"detail": str(serializer.errors["detail"][0])},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.validated_data["user"]
        return Response({"user": UserSerializer(user).data, "tokens": tokens_for_user(user)})


class RefreshView(TokenRefreshView):
    """POST {refresh} -> {access}. Subject to the same scoped throttle."""

    throttle_scope = "auth"

    def get_throttles(self):
        from rest_framework.throttling import ScopedRateThrottle

        return [ScopedRateThrottle()]

    @extend_schema(tags=["Auth"])
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
