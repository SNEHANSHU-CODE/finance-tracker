"""
Master Test Runner
Runs all flow tests and generates comprehensive report
"""
import asyncio
import logging
import sys
from datetime import datetime
from typing import Dict, Any

# Import test modules
from app.utils.test_e2e_flow import run_all_tests as run_e2e_tests
from app.utils.test_components import run_component_tests

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class TestReport:
    """Generate test report"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.results: Dict[str, Dict[str, Any]] = {}
        self.summary = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "duration_seconds": 0
        }
    
    def add_result(self, test_suite: str, result: Dict[str, Any]):
        """Add test result"""
        self.results[test_suite] = result
    
    def generate_summary(self):
        """Generate test summary"""
        self.summary["duration_seconds"] = (datetime.now() - self.start_time).total_seconds()
        
        for suite_name, result in self.results.items():
            if isinstance(result, dict):
                for test_name, test_result in result.items():
                    self.summary["total_tests"] += 1
                    if test_result.get("success"):
                        self.summary["passed"] += 1
                    else:
                        self.summary["failed"] += 1
    
    def print_report(self):
        """Print comprehensive test report"""
        self.generate_summary()
        
        print("\n" + "="*100)
        print("COMPREHENSIVE CHAT FLOW TEST REPORT")
        print("="*100)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Duration: {self.summary['duration_seconds']:.2f} seconds")
        print()
        
        # Overall summary
        print("OVERALL SUMMARY:")
        print(f"  Total Tests:  {self.summary['total_tests']}")
        print(f"  ✅ Passed:    {self.summary['passed']}")
        print(f"  ❌ Failed:    {self.summary['failed']}")
        
        if self.summary['total_tests'] > 0:
            pass_rate = (self.summary['passed'] / self.summary['total_tests']) * 100
            print(f"  Pass Rate:    {pass_rate:.1f}%")
        
        print()
        print("-"*100)
        print()
        
        # Detailed results
        print("DETAILED RESULTS:")
        print()
        
        for suite_name, results in self.results.items():
            print(f"\n📋 {suite_name.upper()}")
            print("-"*100)
            
            if isinstance(results, dict):
                for test_name, test_result in results.items():
                    status = "✅ PASS" if test_result.get("success") else "❌ FAIL"
                    print(f"  {status} - {test_name}")
                    
                    if not test_result.get("success"):
                        error = test_result.get("error", "Unknown error")
                        print(f"        Error: {error[:80]}")
        
        print()
        print("="*100)
        print("END OF REPORT")
        print("="*100)
        print()
    
    def save_report(self, filename: str = "test_report.txt"):
        """Save report to file"""
        with open(filename, "w") as f:
            f.write(self._generate_report_text())
        
        logger.info(f"✅ Report saved to {filename}")
    
    def _generate_report_text(self) -> str:
        """Generate report as text"""
        self.generate_summary()
        
        lines = [
            "="*100,
            "COMPREHENSIVE CHAT FLOW TEST REPORT",
            "="*100,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Duration: {self.summary['duration_seconds']:.2f} seconds",
            "",
            "OVERALL SUMMARY:",
            f"  Total Tests:  {self.summary['total_tests']}",
            f"  ✅ Passed:    {self.summary['passed']}",
            f"  ❌ Failed:    {self.summary['failed']}",
        ]
        
        if self.summary['total_tests'] > 0:
            pass_rate = (self.summary['passed'] / self.summary['total_tests']) * 100
            lines.append(f"  Pass Rate:    {pass_rate:.1f}%")
        
        lines.extend([
            "",
            "-"*100,
            "",
            "DETAILED RESULTS:",
            ""
        ])
        
        for suite_name, results in self.results.items():
            lines.extend([
                f"\n📋 {suite_name.upper()}",
                "-"*100
            ])
            
            if isinstance(results, dict):
                for test_name, test_result in results.items():
                    status = "✅ PASS" if test_result.get("success") else "❌ FAIL"
                    lines.append(f"  {status} - {test_name}")
                    
                    if not test_result.get("success"):
                        error = test_result.get("error", "Unknown error")
                        lines.append(f"        Error: {error[:80]}")
        
        lines.extend([
            "",
            "="*100,
            "END OF REPORT",
            "="*100
        ])
        
        return "\n".join(lines)


async def run_all_flow_tests():
    """Run all flow tests"""
    report = TestReport()
    
    try:
        logger.info("\n" + "="*100)
        logger.info("STARTING COMPREHENSIVE CHAT FLOW TESTS")
        logger.info("="*100 + "\n")
        
        # Test 1: Component Tests
        logger.info("\n🔧 RUNNING COMPONENT-LEVEL TESTS\n")
        try:
            component_results = await run_component_tests()
            report.add_result("component_tests", component_results)
        except Exception as e:
            logger.error(f"❌ Component tests failed: {e}")
            report.add_result("component_tests", {"error": str(e)})
        
        # Test 2: End-to-End Tests
        logger.info("\n🔄 RUNNING END-TO-END FLOW TESTS\n")
        try:
            e2e_results = await run_e2e_tests()
            report.add_result("e2e_tests", e2e_results)
        except Exception as e:
            logger.error(f"❌ E2E tests failed: {e}")
            report.add_result("e2e_tests", {"error": str(e)})
        
        # Note: SocketIO tests skipped if python-socketio not installed
        logger.info("⏭️  SKIPPING SOCKET.IO TESTS (python-socketio not installed)")
        logger.info("💡 Install with: pip install python-socketio")
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        return report
    finally:
        # Print report
        report.print_report()
        
        # Save report
        try:
            report.save_report("chatserver_test_report.txt")
        except Exception as e:
            logger.warning(f"⚠️ Failed to save report: {e}")
    
    return report


def main():
    """Main entry point"""
    try:
        report = asyncio.run(run_all_flow_tests())
        
        # Exit with appropriate code
        if report.summary["failed"] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
    
    except Exception as e:
        logger.error(f"❌ Fatal error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
