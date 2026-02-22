"""
Component-Level Flow Tests
Tests individual components with detailed logging
"""
import asyncio
import logging
from typing import Dict, Any, Optional

from app.utils.flow_logger import FlowLogger
from app.ai.ml.intent_classifier import intent_classifier
from app.ai.tools.data_fetcher import DataFetcher
from app.ai.llm.init import llm_provider
from app.core.database import Database

logger = logging.getLogger(__name__)


class IntentClassificationTest:
    """Test intent classification component"""
    
    @staticmethod
    async def test_intent_classification(
        query: str = "How much did I spend on food?",
        session_id: str = "test_intent"
    ) -> Dict[str, Any]:
        """
        Test intent classification
        
        Args:
            query: Input query
            session_id: Session ID for logging
            
        Returns:
            Test results
        """
        flow_logger = FlowLogger(session_id, "intent_test")
        
        try:
            logger.info("\n" + "="*80)
            logger.info("TESTING: INTENT CLASSIFICATION")
            logger.info("="*80)
            
            flow_logger.log_query_received(query, is_authenticated=False)
            
            logger.info(f"📝 Query: {query}")
            logger.info("🎯 Classifying intent...")
            
            # Perform classification
            result = intent_classifier.classify(query)
            
            flow_logger.log_intent_classified(
                primary_intent=result.primary_intent,
                confidence=result.confidence,
                intents={
                    "transactions": result.confidence if result.primary_intent == "transactions" else 0.1,
                    "goals": result.confidence if result.primary_intent == "goals" else 0.1,
                    "reminders": result.confidence if result.primary_intent == "reminders" else 0.1,
                }
            )
            
            logger.info(f"✅ Intent: {result.primary_intent}")
            logger.info(f"📊 Confidence: {result.confidence:.2%}")
            
            time_range = intent_classifier.extract_time_range(query)
            logger.info(f"⏰ Time Range: {time_range}")
            
            return {
                "success": True,
                "query": query,
                "intent": result.primary_intent,
                "confidence": result.confidence,
                "time_range": time_range,
                "flow_summary": flow_logger.get_summary()
            }
        
        except Exception as e:
            logger.error(f"❌ Intent classification error: {e}")
            flow_logger.log_intent_classification_failed(str(e))
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "flow_summary": flow_logger.get_summary()
            }
        finally:
            flow_logger.print_summary()


class DataFetchingTest:
    """Test data fetching component"""
    
    @staticmethod
    async def test_data_fetching(
        user_id: str = "test_user_123",
        session_id: str = "test_data_fetch"
    ) -> Dict[str, Any]:
        """
        Test data fetching
        
        Args:
            user_id: User ID
            session_id: Session ID for logging
            
        Returns:
            Test results
        """
        flow_logger = FlowLogger(session_id, user_id)
        
        try:
            logger.info("\n" + "="*80)
            logger.info("TESTING: DATA FETCHING")
            logger.info("="*80)
            
            # Connect to database
            await Database.connect_db()
            db = Database.get_db()
            
            flow_logger.log_data_fetch_initiated(
                intents={
                    "transactions": True,
                    "goals": True,
                    "reminders": True
                },
                time_range="last_30_days"
            )
            
            logger.info(f"👤 User ID: {user_id}")
            logger.info("🔍 Fetching financial data...")
            
            # Create data fetcher
            fetcher = DataFetcher(db)
            
            # Fetch different data types
            results = {
                "transactions": None,
                "goals": None,
                "reminders": None
            }
            
            # Fetch transactions
            try:
                logger.info("📊 Fetching transactions...")
                trans_data = await fetcher.fetch_transactions(user_id, days=30)
                results["transactions"] = trans_data
                
                trans_count = len(trans_data.get("transactions", []))
                flow_logger.log_data_found(
                    intent="transactions",
                    count=trans_count,
                    summary=trans_data.get("summary")
                )
                logger.info(f"✅ Fetched {trans_count} transactions")
            except Exception as e:
                logger.warning(f"⚠️ Transaction fetch failed: {e}")
                flow_logger.log_data_fetch_failed("transactions", str(e))
            
            # Fetch goals
            try:
                logger.info("🎯 Fetching goals...")
                goals_data = await fetcher.fetch_goals(user_id)
                results["goals"] = goals_data
                
                goals_count = len(goals_data.get("goals", []))
                flow_logger.log_data_found(
                    intent="goals",
                    count=goals_count,
                    summary=goals_data.get("summary")
                )
                logger.info(f"✅ Fetched {goals_count} goals")
            except Exception as e:
                logger.warning(f"⚠️ Goals fetch failed: {e}")
                flow_logger.log_data_fetch_failed("goals", str(e))
            
            # Fetch reminders
            try:
                logger.info("📌 Fetching reminders...")
                reminders_data = await fetcher.fetch_reminders(user_id)
                results["reminders"] = reminders_data
                
                reminders_count = len(reminders_data.get("reminders", []))
                flow_logger.log_data_found(
                    intent="reminders",
                    count=reminders_count,
                    summary=reminders_data.get("summary")
                )
                logger.info(f"✅ Fetched {reminders_count} reminders")
            except Exception as e:
                logger.warning(f"⚠️ Reminders fetch failed: {e}")
                flow_logger.log_data_fetch_failed("reminders", str(e))
            
            return {
                "success": True,
                "user_id": user_id,
                "data": results,
                "flow_summary": flow_logger.get_summary()
            }
        
        except Exception as e:
            logger.error(f"❌ Data fetching error: {e}")
            flow_logger.log_data_fetch_failed("all", str(e))
            return {
                "success": False,
                "user_id": user_id,
                "error": str(e),
                "flow_summary": flow_logger.get_summary()
            }
        finally:
            await Database.close_db()
            flow_logger.print_summary()


class LLMTest:
    """Test LLM component"""
    
    @staticmethod
    async def test_llm_call(
        query: str = "What's my financial status?",
        provider: str = "gemini",
        session_id: str = "test_llm"
    ) -> Dict[str, Any]:
        """
        Test LLM call
        
        Args:
            query: Input query
            provider: LLM provider (gemini or grok)
            session_id: Session ID for logging
            
        Returns:
            Test results
        """
        flow_logger = FlowLogger(session_id, f"llm_test_{provider}")
        
        try:
            logger.info("\n" + "="*80)
            logger.info(f"TESTING: LLM CALL ({provider})")
            logger.info("="*80)
            
            flow_logger.log_llm_call_initiated(provider=provider, model="test-model")
            
            logger.info(f"📝 Query: {query}")
            logger.info(f"🤖 Provider: {provider}")
            logger.info("⏳ Waiting for LLM response...")
            
            # Get LLM
            try:
                llm = await llm_provider.get_llm(provider)
            except Exception as e:
                logger.error(f"❌ Failed to get LLM: {e}")
                flow_logger.log_llm_call_failed(provider, str(e))
                return {
                    "success": False,
                    "query": query,
                    "provider": provider,
                    "error": str(e),
                    "flow_summary": flow_logger.get_summary()
                }
            
            # Invoke LLM
            from langchain_core.messages import HumanMessage, SystemMessage
            
            system_prompt = "You are a helpful financial advisor. Answer the user's question concisely."
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=query)
            ]
            
            response = await llm.ainvoke(messages)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            flow_logger.log_llm_response_received(
                provider=provider,
                response_length=len(response_text),
                tokens_used=None
            )
            
            logger.info(f"✅ Response received ({len(response_text)} characters)")
            logger.info(f"💬 Response: {response_text[:200]}...")
            
            flow_logger.log_response_generated(
                response_type=f"llm_{provider}",
                response_preview=response_text
            )
            
            return {
                "success": True,
                "query": query,
                "provider": provider,
                "response": response_text,
                "response_length": len(response_text),
                "flow_summary": flow_logger.get_summary()
            }
        
        except Exception as e:
            logger.error(f"❌ LLM call error: {e}")
            flow_logger.log_llm_call_failed(provider, str(e))
            return {
                "success": False,
                "query": query,
                "provider": provider,
                "error": str(e),
                "flow_summary": flow_logger.get_summary()
            }
        finally:
            flow_logger.print_summary()


async def run_component_tests():
    """Run all component tests"""
    logger.info("\n" + "="*80)
    logger.info("STARTING COMPONENT-LEVEL FLOW TESTS")
    logger.info("="*80 + "\n")
    
    results = {}
    
    # Test 1: Intent Classification
    logger.info("\n--- TEST 1: INTENT CLASSIFICATION ---\n")
    test_queries = [
        "How much did I spend last month?",
        "What are my financial goals?",
        "Set a reminder for bill payment",
        "General financial advice"
    ]
    
    for query in test_queries:
        results[f"intent_{query[:20]}"] = await IntentClassificationTest.test_intent_classification(
            query=query,
            session_id=f"test_intent_{query[:10]}"
        )
    
    # Test 2: Data Fetching
    logger.info("\n--- TEST 2: DATA FETCHING ---\n")
    results["data_fetching"] = await DataFetchingTest.test_data_fetching(
        user_id="test_user_123",
        session_id="test_data_fetch"
    )
    
    # Test 3: LLM Calls
    logger.info("\n--- TEST 3: LLM CALLS ---\n")
    
    # Gemini
    results["llm_gemini"] = await LLMTest.test_llm_call(
        query="What's a good savings strategy?",
        provider="gemini",
        session_id="test_llm_gemini"
    )
    
    # Grok (if available)
    results["llm_grok"] = await LLMTest.test_llm_call(
        query="What's a good savings strategy?",
        provider="grok",
        session_id="test_llm_grok"
    )
    
    # Summary
    logger.info("\n" + "="*80)
    logger.info("COMPONENT TEST SUMMARY")
    logger.info("="*80)
    
    passed = sum(1 for r in results.values() if r.get("success"))
    total = len(results)
    
    logger.info(f"Total Tests: {total}")
    logger.info(f"Passed: {passed}")
    logger.info(f"Failed: {total - passed}")
    
    for test_name, result in results.items():
        status = "✅" if result.get("success") else "❌"
        logger.info(f"{status} {test_name}")
    
    logger.info("="*80 + "\n")
    
    return results


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(run_component_tests())
