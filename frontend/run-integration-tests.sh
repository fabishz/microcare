#!/bin/bash

# Frontend-Backend Integration Test Runner
# This script runs comprehensive integration tests for MicroCare

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MicroCare Integration Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if backend is running
check_backend() {
    echo -e "${YELLOW}Checking backend health...${NC}"
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${RED}✗ Backend is not running at http://localhost:3000${NC}"
        echo -e "${YELLOW}Please start the backend with: cd backend && npm run dev${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Backend is running${NC}"
}

# Check if database is accessible
check_database() {
    echo -e "${YELLOW}Checking database connection...${NC}"
    if ! timeout 5 bash -c "echo > /dev/tcp/localhost/5432" 2>/dev/null; then
        echo -e "${RED}✗ PostgreSQL is not running at localhost:5432${NC}"
        echo -e "${YELLOW}Please ensure PostgreSQL is running${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Database is accessible${NC}"
}

# Run API integration tests
run_api_tests() {
    echo -e "${BLUE}Running API Integration Tests...${NC}"
    if npm test -- src/tests/integration/api.integration.test.ts --testTimeout=30000; then
        echo -e "${GREEN}✓ API Integration Tests Passed${NC}"
        return 0
    else
        echo -e "${RED}✗ API Integration Tests Failed${NC}"
        return 1
    fi
}

# Run hooks integration tests (if testing library is installed)
run_hooks_tests() {
    echo -e "${BLUE}Running Hooks Integration Tests...${NC}"
    if npm list @testing-library/react > /dev/null 2>&1; then
        if npm test -- src/tests/integration/hooks.integration.test.ts --testTimeout=30000; then
            echo -e "${GREEN}✓ Hooks Integration Tests Passed${NC}"
            return 0
        else
            echo -e "${RED}✗ Hooks Integration Tests Failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ Skipping Hooks Tests (@testing-library/react not installed)${NC}"
        echo -e "${YELLOW}  Install with: npm install --save-dev @testing-library/react${NC}"
        return 0
    fi
}

# Main execution
main() {
    local tests_passed=0
    local tests_failed=0

    # Pre-flight checks
    check_backend
    check_database

    echo ""

    # Run tests
    if run_api_tests; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi

    echo ""

    if run_hooks_tests; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Passed: ${GREEN}${tests_passed}${NC}"
    echo -e "Failed: ${RED}${tests_failed}${NC}"

    if [ $tests_failed -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo -e "${BLUE}========================================${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        echo -e "${BLUE}========================================${NC}"
        exit 1
    fi
}

# Parse command line arguments
if [ "$1" == "api" ]; then
    check_backend
    check_database
    run_api_tests
elif [ "$1" == "hooks" ]; then
    check_backend
    check_database
    run_hooks_tests
elif [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: ./run-integration-tests.sh [command]"
    echo ""
    echo "Commands:"
    echo "  (none)    Run all integration tests"
    echo "  api       Run only API integration tests"
    echo "  hooks     Run only hooks integration tests"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run-integration-tests.sh"
    echo "  ./run-integration-tests.sh api"
    echo "  ./run-integration-tests.sh hooks"
else
    main
fi
