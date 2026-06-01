#!/usr/bin/env python3
"""
View what's currently stored in AgentCore Memory
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bedrock_agentcore.memory import MemoryClient
import json

MEMORY_ID = os.environ.get("MAINTENANCE_AGENT_MEMORY_ID")
if not MEMORY_ID:
    raise EnvironmentError(
        "MAINTENANCE_AGENT_MEMORY_ID environment variable is required. "
        "Example: vehicle_maintenance_agent_mem-XXXXXXXXXX"
    )

MEMORY_NAMESPACE = os.environ.get("MEMORY_NAMESPACE")
if not MEMORY_NAMESPACE:
    raise EnvironmentError(
        "MEMORY_NAMESPACE environment variable is required. "
        "Example: /strategies/semantic_builtin_XXXXXXXX/actors/fleet_manager"
    )


def view_memory():
    print("🔍 Viewing AgentCore Memory Contents")
    print("=" * 80)
    
    client = MemoryClient(region_name=os.environ.get("AWS_REGION", "us-east-1"))
    
    # Try to retrieve all memories
    print("\n📋 Searching for all vehicle-related memories...")
    print(f"   Using namespace: {MEMORY_NAMESPACE}")
    try:
        # Use the configured namespace (typically a semantic strategy namespace)
        memories = client.retrieve_memories(
            memory_id=MEMORY_ID,
            namespace=MEMORY_NAMESPACE,
            query="vehicle",
            top_k=20
        )
        
        if not memories:
            print("❌ No memories found yet!")
            print()
            print("💡 Memory is empty. To populate it:")
            print("   1. Run: python3 scripts/seed_memory_for_demo.py")
            print("   2. Or use the agent a few times")
            return
        
        print(f"✅ Found {len(memories)} memories!\n")
        
        for i, mem in enumerate(memories, 1):
            print(f"{'='*80}")
            print(f"Memory #{i}")
            print(f"{'='*80}")
            
            if isinstance(mem, dict):
                # Pretty print the memory
                content = mem.get('content', {})
                text = content.get('text', 'No text')
                metadata = mem.get('metadata', {})
                
                print(f"📝 Content: {text[:200]}...")
                if metadata:
                    print(f"📊 Metadata: {json.dumps(metadata, indent=2, default=str)}")
            else:
                print(f"📝 {str(mem)[:200]}...")
            print()
        
    except Exception as e:
        print(f"❌ Error retrieving memories: {e}")
        print()
        print("💡 This might mean:")
        print("   - Memory is empty (no interactions yet)")
        print("   - LTM extraction hasn't run yet (takes a few minutes)")
        print("   - Memory mode might still be STM_ONLY")


if __name__ == "__main__":
    view_memory()
