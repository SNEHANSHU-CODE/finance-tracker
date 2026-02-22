"""
End-to-End Chat Flow Test
Tests the entire flow from client connection to response
"""
import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, Any, Optional
import logging

from app.utils.flow_logger import FlowLogger, FlowEvent

logger = logging.getLogger(__name__)


class EndToEndChatTest:
    """
    End-to-end test for the entire chat flow
    Simulates: Connection → Auth → Query → Data Fetch → LLM → Response
    """
    
    def __init__(self, base_url: str = "http://localhost:5002"):
        self.base_url = base_url
        self.flow_logger: Optional[FlowLogger] = None
        self.session_id = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    async def test_authenticated_flow(
        self,
        token: Optional[str] = None,
        user_id: Optional[str] = None,
        query: str = "How much did I spend last month?"
    ) -> Dict[str, Any]:
        """
        Test authenticated user flow
        
        Args:
            token: Authentication token
            user_id: User ID (optional)
            query: Test query
            
        Returns:
            Flow results and logs
        """
        self.flow_logger = FlowLogger(self.session_id, user_id)
        self.flow_logger.log_connection({
            "type": "authenticated",
            "has_token": bool(token)
        })
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Step 1: Connection
                self.flow_logger.log_connected()
                
                # Step 2: Authentication (simulated via token in header)
                self.flow_logger.log_auth_initiated(has_token=bool(token), is_guest=False)
                
                if token:
                    self.flow_logger.log_auth_verified(
                        user_id=user_id or "unknown",
                        username="TestUser",
                        auth_provider="test"
                    )
                    self.flow_logger.log_authenticated(
                        user_id=user_id or "unknown",
                        username="TestUser",
                        email="test@example.com"
                    )
                
                # Step 3: Send Query
                self.flow_logger.log_query_received(query, is_authenticated=True)
                
                # Step 4: Intent Classification (happens in backend)
                self.flow_logger.log_intent_classified(
                    primary_intent="transactions",
                    confidence=0.85,
                    intents={"transactions": 0.85, "goals": 0.10, "reminders": 0.05}
                )
                
                # Step 5: Data Fetching
                self.flow_logger.log_data_fetch_initiated(
                    intents={"transactions": True, "goals": False, "reminders": False},
                    time_range="last_30_days"
                )
                
                # Step 6: Call Chat API
                self.flow_logger.log_llm_call_initiated(provider="gemini", model="gemini-2.0-flash")
                
                response = await client.post(
                    f"{self.base_url}/api/chat/query",
                    json={
                        "content": query,
                        "provider": "gemini"
                    },
                    headers={
                        "user-id": user_id or "test_user"
                    } if token else {}
                )
                
                # Step 7: Check Response
                if response.status_code == 200:
                    data = response.json()
                    
                    self.flow_logger.log_data_found(
                        intent="transactions",
                        count=5,
                        summary={"total": 500}
                    )
                    
                    self.flow_logger.log_llm_response_received(
                        provider="gemini",
                        response_length=len(data.get("response", "")),
                        tokens_used=None
                    )
                    
                    response_text = data.get("response", "")
                    self.flow_logger.log_response_generated(
                        response_type="authenticated",
                        response_preview=response_text
                    )
                    
                    self.flow_logger.log_response_sent(
                        response_length=len(response_text),
                        request_id=None
                    )
                    
                    logger.info(f"✅ Authenticated flow completed successfully")
                    return {
                        "success": True,
                        "response": data,
                        "flow_summary": self.flow_logger.get_summary()
                    }
                else:
                    error_msg = response.text
                    self.flow_logger.log_llm_call_failed(
                        provider="gemini",
                        error=error_msg[:100]
                    )
                    logger.error(f"❌ API call failed with status {response.status_code}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "status_code": response.status_code,
                        "flow_summary": self.flow_logger.get_summary()
                    }
        
        except Exception as e:
            logger.error(f"❌ Authenticated flow error: {e}")
            if self.flow_logger:
                self.flow_logger.log_llm_call_failed("gemini", str(e))
            return {
                "success": False,
                "error": str(e),
                "flow_summary": self.flow_logger.get_summary() if self.flow_logger else {}
            }
        finally:
            if self.flow_logger:
                self.flow_logger.log_cleanup()
                self.flow_logger.print_summary()
    
    async def test_guest_flow(
        self,
        query: str = "What's a good savings strategy?"
    ) -> Dict[str, Any]:
        """
        Test guest (unauthenticated) user flow
        
        Args:
            query: Test query
            
        Returns:
            Flow results and logs
        """
        self.flow_logger = FlowLogger(self.session_id, "guest")
        self.flow_logger.log_connection({
            "type": "guest",
            "has_token": False
        })
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Step 1: Connection
                self.flow_logger.log_connected()
                
                # Step 2: Guest Mode
                self.flow_logger.log_auth_initiated(has_token=False, is_guest=True)
                self.flow_logger.log_guest_mode(guest_id="guest_anonymous")
                
                # Step 3: Query Received
                self.flow_logger.log_query_received(query, is_authenticated=False)
                
                # Step 4: Intent Classification
                self.flow_logger.log_intent_classified(
                    primary_intent="general",
                    confidence=0.72,
                    intents={"transactions": 0.22, "goals": 0.40, "reminders": 0.10}
                )
                
                # Step 5: Data Fetch (limited for guest)
                self.flow_logger.log_data_fetch_initiated(
                    intents={"transactions": False, "goals": False, "reminders": False},
                    time_range=None
                )
                
                # Step 6: LLM Call
                self.flow_logger.log_llm_call_initiated(provider="gemini", model="gemini-2.0-flash")
                
                response = await client.post(
                    f"{self.base_url}/api/chat/query",
                    json={
                        "content": query,
                        "provider": "gemini"
                    }
                )
                
                # Step 7: Process Response
                if response.status_code == 200:
                    data = response.json()
                    
                    self.flow_logger.log_llm_response_received(
                        provider="gemini",
                        response_length=len(data.get("response", "")),
                        tokens_used=None
                    )
                    
                    response_text = data.get("response", "")
                    self.flow_logger.log_response_generated(
                        response_type="guest",
                        response_preview=response_text
                    )
                    
                    self.flow_logger.log_response_sent(
                        response_length=len(response_text),
                        request_id=None
                    )
                    
                    logger.info("✅ Guest flow completed successfully")
                    return {
                        "success": True,
                        "response": data,
                        "flow_summary": self.flow_logger.get_summary()
                    }
                else:
                    error_msg = response.text
                    self.flow_logger.log_llm_call_failed(
                        provider="gemini",
                        error=error_msg[:100]
                    )
                    logger.error(f"❌ API call failed with status {response.status_code}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "status_code": response.status_code,
                        "flow_summary": self.flow_logger.get_summary()
                    }
        
        except Exception as e:
            logger.error(f"❌ Guest flow error: {e}")
            if self.flow_logger:
                self.flow_logger.log_llm_call_failed("gemini", str(e))
            return {
                "success": False,
                "error": str(e),
                "flow_summary": self.flow_logger.get_summary() if self.flow_logger else {}
            }
        finally:
            if self.flow_logger:
                self.flow_logger.log_cleanup()
                self.flow_logger.print_summary()
    
    async def test_error_handling(
        self,
        query: str = "Test query that might fail"
    ) -> Dict[str, Any]:
        """
        Test error handling in the flow
        
        Args:
            query: Test query
            
        Returns:
            Flow results and logs
        """
        self.flow_logger = FlowLogger(self.session_id, "error_test")
        self.flow_logger.log_connection({
            "type": "error_test",
            "has_token": False
        })
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                self.flow_logger.log_connected()
                self.flow_logger.log_guest_mode("error_test")
                self.flow_logger.log_query_received(query, is_authenticated=False)
                
                # Send invalid query
                response = await client.post(
                    f"{self.base_url}/api/chat/query",
                    json={
                        "content": "",  # Empty query
                        "provider": "invalid"  # Invalid provider
                    }
                )
                
                if response.status_code != 200:
                    error_msg = response.text
                    self.flow_logger.log_llm_call_failed(
                        provider="invalid",
                        error=error_msg[:100]
                    )
                    
                    logger.info(f"✅ Error handling test completed (expected error)")
                    return {
                        "success": False,
                        "error": error_msg,
                        "status_code": response.status_code,
                        "flow_summary": self.flow_logger.get_summary()
                    }
        
        except Exception as e:
            logger.error(f"Error in error handling test: {e}")
            if self.flow_logger:
                self.flow_logger.log_disconnection(reason=str(e))
            return {
                "success": False,
                "error": str(e),
                "flow_summary": self.flow_logger.get_summary() if self.flow_logger else {}
            }
        finally:
            if self.flow_logger:
                self.flow_logger.log_cleanup()
                self.flow_logger.print_summary()


async def run_all_tests():
    """Run all end-to-end tests"""
    logger.info("\n" + "="*80)
    logger.info("STARTING END-TO-END CHAT FLOW TESTS")
    logger.info("="*80 + "\n")
    
    tester = EndToEndChatTest()
    results = {}
    
    # Test 1: Guest Flow
    logger.info("\n--- TEST 1: GUEST USER FLOW ---\n")
    results["guest_flow"] = await tester.test_guest_flow(
        query="What's a good financial habit?"
    )
    
    # Test 2: Authenticated Flow
    logger.info("\n--- TEST 2: AUTHENTICATED USER FLOW ---\n")
    results["authenticated_flow"] = await tester.test_authenticated_flow(
        token="test_token",
        user_id="test_user_123",
        query="Show me my spending analysis"
    )
    
    # Test 3: Error Handling
    logger.info("\n--- TEST 3: ERROR HANDLING ---\n")
    results["error_handling"] = await tester.test_error_handling()
    
    # Summary
    logger.info("\n" + "="*80)
    logger.info("TEST RESULTS SUMMARY")
    logger.info("="*80)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result.get("success") else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info("="*80 + "\n")
    
    return results


if __name__ == "__main__":
    # To run standalone
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(run_all_tests())
