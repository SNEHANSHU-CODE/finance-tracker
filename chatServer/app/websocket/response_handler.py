"""
Message Response Handler
Handles LLM response generation for authenticated and guest users
Separate from WebSocket concerns - only responsible for generating responses
"""
import logging
from typing import Dict, Any, Literal
from app.websocket.logger import WebSocketLogger
from app.ai.llm.fallback import get_fallback_message

logger = logging.getLogger(__name__)


class MessageResponseHandler:
    """Handles message responses from LLM"""
    
    @staticmethod
    async def handle_authenticated_message(
        user_id: str,
        username: str,
        message: str,
        conversation_history: list
    ) -> dict:
        """
        Handle message for authenticated user
        Delegates to LLM orchestrator
        
        Args:
            user_id: User ID
            username: Username
            message: User message
            conversation_history: Chat history
            
        Returns:
            Response dict with 'text', 'provider', 'metadata'
        """
        try:
            from app.ai.orchestrator import get_orchestrator
            from app.core.database import Database
            from app.ai.utils.pii_masker import mask_message, get_safety_message
            
            # Step 1: Log the query
            WebSocketLogger.log_user_query(username, message, is_authenticated=True)
            
            # Step 2: Mask PII in the message
            pii_result = mask_message(message)
            masked_msg = pii_result.masked
            
            # Step 3: Get response from LLM
            db = Database.get_db()
            orchestrator = await get_orchestrator(db)
            
            result = await orchestrator.process_authenticated_query(
                user_id=user_id,
                query=masked_msg
            )
            
            # Step 4: Handle errors
            if result.get("status") == "error":
                error_msg = result.get('error', 'Unknown error')
                logger.error(f"LLM Error for {username}: {error_msg}")
                fallback = get_fallback_message("authenticated", "default")
                WebSocketLogger.log_fallback_triggered(error_msg, username)
                return fallback
            
            response_text = result.get("response", "No response generated")
            from app.ai.config import llm_settings
            provider = result.get("provider", llm_settings.DEFAULT_LLM)
            
            # Step 5: Add safety message if PII was detected
            safety_message = get_safety_message(pii_result)
            if pii_result.has_sensitive_info and safety_message:
                response_text = f"{safety_message}\n\n{response_text}"
            
            # Step 6: Log response
            WebSocketLogger.log_response_generated(
                provider=provider,
                response_text=response_text,
                is_authenticated=True,
                username=username
            )
            
            return {
                "text": response_text,
                "provider": provider,
                "metadata": {
                    "user_id": user_id,
                    "response_type": "authenticated",
                    "pii_masked": pii_result.has_sensitive_info,
                }
            }
            
        except Exception as e:
            logger.error(f"Error in authenticated message handler: {e}", exc_info=True)
            WebSocketLogger.log_fallback_triggered(str(e), username)
            return get_fallback_message("authenticated", "default")
    
    @staticmethod
    async def handle_guest_message(message: str) -> dict:
        """
        Handle message for guest user
        Provides general financial guidance
        
        Args:
            message: User message
            
        Returns:
            Response dict with 'text', 'provider', 'metadata'
        """
        try:
            from app.ai.prompts.guestTemplate import (
                GUEST_SYSTEM_PROMPT,
                GuestPromptBuilder,
                GUEST_SIGNIN_PROMPT
            )
            from app.ai.utils.pii_masker import mask_message, get_safety_message
            from app.ai.utils.fast_classifier import classify
            from app.ai.llm.init import llm_provider
            from langchain_core.messages import SystemMessage, HumanMessage
            import asyncio
            
            # Step 1: Log the query
            WebSocketLogger.log_user_query("guest", message, is_authenticated=False)
            
            # Step 2: Mask PII in the message
            pii_result = mask_message(message)
            masked_msg = pii_result.masked
            
            # Step 3: Quick intent classification (NO LLM - fast!)
            intent_result = classify(masked_msg)
            
            # Small delay for perceived processing
            await asyncio.sleep(0.3)
            
            # Step 4: Check if asking for personal data
            needs_data = intent_result.requires_auth or any(
                keyword in masked_msg.lower()
                for keyword in ["my", "i spent", "my transactions", "my goals",
                               "my budget", "my history", "how much did i"]
            )
            
            from app.ai.config import llm_settings
            provider_used = llm_settings.DEFAULT_LLM
            
            if needs_data:
                # User asking for personalized data - show sign-in prompt
                guest_response = GUEST_SIGNIN_PROMPT
                provider_used = "informational"
                WebSocketLogger.log_response_generated(
                    provider="informational",
                    response_text=guest_response,
                    is_authenticated=False,
                    username="guest"
                )
            else:
                # Step 5: Get general LLM response with fallback
                prompt_vars = GuestPromptBuilder.build_guest_prompt(user_input=masked_msg)
                system_prompt = GUEST_SYSTEM_PROMPT.format(**prompt_vars)
                
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=masked_msg)
                ]
                
                # Try primary provider first with proper fallback chain
                provider_used = llm_settings.DEFAULT_LLM
                llm = await llm_provider.get_default_llm()
                guest_response = None
                
                try:
                    response = await llm.ainvoke(messages)
                    guest_response = response.content if hasattr(response, 'content') else str(response)
                    logger.info(f"✅ {provider_used.upper()} succeeded for guest")
                except Exception as llm_error:
                    logger.error(f"❌ {provider_used} failed for guest: {llm_error}")
                    # Fallback to Gemini if primary fails and primary is not Gemini
                    if provider_used != "gemini":
                        logger.info("⚠️ Falling back to Gemini for guest message...")
                        try:
                            provider_used = "gemini"
                            fallback_llm = await llm_provider.get_gemini_llm()
                            response = await fallback_llm.ainvoke(messages)
                            guest_response = response.content if hasattr(response, 'content') else str(response)
                            logger.info("✅ Gemini fallback succeeded for guest")
                        except Exception as fallback_error:
                            logger.error(f"❌ Gemini fallback also failed: {fallback_error}")
                            raise Exception(f"Both {llm_settings.DEFAULT_LLM} and Gemini failed")
                    else:
                        raise Exception(f"Gemini failed: {llm_error}")
                
                WebSocketLogger.log_response_generated(
                    provider=provider_used,
                    response_text=guest_response,
                    is_authenticated=False,
                    username="guest"
                )
            
            # Step 6: Add safety message if PII was detected
            safety_message = get_safety_message(pii_result)
            if pii_result.has_sensitive_info and safety_message:
                guest_response = f"{safety_message}\n\n{guest_response}"
            
            return {
                "text": guest_response,
                "provider": provider_used,
                "metadata": {
                    "response_type": "guest",
                    "needs_authentication": needs_data,
                    "intent": intent_result.primary_intent,
                    "pii_masked": pii_result.has_sensitive_info,
                }
            }
            
        except Exception as e:
            logger.error(f"Error in guest message handler: {e}", exc_info=True)
            WebSocketLogger.log_fallback_triggered(str(e), "guest")
            return get_fallback_message("guest", "default")
