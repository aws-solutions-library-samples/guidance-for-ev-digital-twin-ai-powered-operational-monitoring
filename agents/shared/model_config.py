"""
BedrockModel factory and configuration helpers.
Extracted from AgentCoreMaintenanceAgent.create_agent() and module-level helpers.
"""

from strands.models.bedrock import BedrockModel
try:
    from strands.models import CacheConfig
    CACHE_CONFIG_AVAILABLE = True
except ImportError:
    CACHE_CONFIG_AVAILABLE = False
import boto3
import json
import os

# Model configuration - Claude Sonnet 4.5 via inference profile
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0')

# Bedrock Guardrails configuration - loaded from environment variables
GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID', '')
_GUARDRAIL_VERSION_CACHE = None


def get_guardrail_version():
    """Get guardrail version - uses env var if set, otherwise fetches latest from API"""
    global _GUARDRAIL_VERSION_CACHE

    if _GUARDRAIL_VERSION_CACHE is not None:
        return _GUARDRAIL_VERSION_CACHE

    # Check if explicitly set via environment variable
    env_version = os.environ.get('BEDROCK_GUARDRAIL_VERSION', '')
    if env_version:
        _GUARDRAIL_VERSION_CACHE = env_version
        return _GUARDRAIL_VERSION_CACHE

    # Auto-detect latest version from Bedrock API
    if GUARDRAIL_ID:
        try:
            bedrock_client = boto3.client('bedrock', region_name='us-east-1')
            response = bedrock_client.get_guardrail(guardrailIdentifier=GUARDRAIL_ID)
            _GUARDRAIL_VERSION_CACHE = response.get('version', '1')
            print(f"✅ Auto-detected guardrail version: {_GUARDRAIL_VERSION_CACHE}")
            return _GUARDRAIL_VERSION_CACHE
        except Exception as e:
            print(f"⚠️ Could not auto-detect guardrail version: {e}, defaulting to '1'")
            _GUARDRAIL_VERSION_CACHE = '1'
            return _GUARDRAIL_VERSION_CACHE

    return '1'


# Browser Tool configuration - Load from Secrets Manager (lazy-loaded)
_NOVA_ACT_API_KEY_CACHE = None  # Cache the key once loaded


def get_nova_act_key():
    """Retrieve NovaAct API key from AWS Secrets Manager (lazy-loaded on first use)"""
    global _NOVA_ACT_API_KEY_CACHE

    # Return cached key if already loaded
    if _NOVA_ACT_API_KEY_CACHE is not None:
        return _NOVA_ACT_API_KEY_CACHE

    try:
        import boto3
        import json
        client = boto3.client('secretsmanager', region_name='us-east-1')
        response = client.get_secret_value(SecretId='/vehicle-maintenance/novaact-api-key')
        secret = json.loads(response['SecretString'])
        _NOVA_ACT_API_KEY_CACHE = secret['NOVA_ACT_API_KEY']
        print("✅ NovaAct API key loaded from Secrets Manager")
        return _NOVA_ACT_API_KEY_CACHE
    except Exception as e:
        print(f"⚠️  Could not load NovaAct API key from Secrets Manager: {e}")
        # Fallback to environment variable for local development only
        api_key = os.environ.get('NOVA_ACT_API_KEY')
        if not api_key:
            raise ValueError(
                "NovaAct API key not found! Browser automation (order_tire_online) requires the API key.\n"
                "Please either:\n"
                "1. Create secret in AWS Secrets Manager: /vehicle-maintenance/novaact-api-key\n"
                "2. Set environment variable: NOVA_ACT_API_KEY\n"
                "See docs/AGENTCORE_SETUP.md for setup instructions."
            )
        _NOVA_ACT_API_KEY_CACHE = api_key
        print("✅ NovaAct API key loaded from environment variable")
        return _NOVA_ACT_API_KEY_CACHE


def create_bedrock_model():
    """Create BedrockModel with guardrails and prompt caching (same config as original).

    Returns a configured BedrockModel instance ready for use with a Strands Agent.
    """
    cache_kwargs = {'cache_config': CacheConfig(strategy="auto")} if CACHE_CONFIG_AVAILABLE else {}

    if GUARDRAIL_ID:
        guardrail_version = get_guardrail_version()
        model = BedrockModel(
            model_id=MODEL_ID,
            region_name="us-east-1",
            **cache_kwargs,
            guardrail_id=GUARDRAIL_ID,
            guardrail_version=guardrail_version,
            guardrail_trace="enabled",
            guardrail_redact_input=True,
            guardrail_redact_output=False
        )
        print(f"🛡️  Bedrock Guardrails enabled: {GUARDRAIL_ID} (version: {guardrail_version})")
    else:
        model = BedrockModel(
            model_id=MODEL_ID,
            region_name="us-east-1",
            **cache_kwargs,
        )
        print("ℹ️  Bedrock Guardrails not configured - set BEDROCK_GUARDRAIL_ID to enable")

    if CACHE_CONFIG_AVAILABLE:
        print("⚡ Prompt caching enabled (strategy: auto)")
    else:
        print("ℹ️  Prompt caching not available - upgrade strands-agents for CacheConfig support")

    return model
