#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
        sleep 2
    fi
}

echo -e "${BLUE}🚀 Starting development environment...${NC}"

# Define ports
FRONTEND_PORT=3000
BACKEND_PORT=3002

# Create logs directory if it doesn't exist
mkdir -p logs

# Log files
BACKEND_LOG="logs/backend.log"
FRONTEND_LOG="logs/frontend.log"

# Always stop existing services first
echo -e "${BLUE}🛑 Stopping any existing services...${NC}"

if check_port $FRONTEND_PORT; then
    echo -e "${YELLOW}⚠️  Stopping frontend service on port $FRONTEND_PORT${NC}"
    kill_port $FRONTEND_PORT
fi

if check_port $BACKEND_PORT; then
    echo -e "${YELLOW}⚠️  Stopping backend service on port $BACKEND_PORT${NC}"
    kill_port $BACKEND_PORT
fi

echo -e "${GREEN}✅ All existing services stopped${NC}"

# Clear previous logs
> $BACKEND_LOG
> $FRONTEND_LOG

# Start both services
echo -e "${BLUE}🔄 Starting both frontend and backend...${NC}"

# Start backend first (it usually takes longer to start)
echo -e "${BLUE}Starting backend...${NC}"
(pnpm --filter backend start:dev > $BACKEND_LOG 2>&1) &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}Starting frontend...${NC}"
(pnpm --filter frontend start:dev > $FRONTEND_LOG 2>&1) &
FRONTEND_PID=$!

# Wait a bit more and check if both started successfully
sleep 5

if check_port $BACKEND_PORT; then
    echo -e "${GREEN}✅ Backend started successfully on port $BACKEND_PORT${NC}"
else
    echo -e "${RED}❌ Backend failed to start on port $BACKEND_PORT${NC}"
fi

if check_port $FRONTEND_PORT; then
    echo -e "${GREEN}✅ Frontend started successfully on port $FRONTEND_PORT${NC}"
else
    echo -e "${RED}❌ Frontend failed to start on port $FRONTEND_PORT${NC}"
fi

echo -e "\n${GREEN}🎉 Development environment ready!${NC}"
echo -e "Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "\n${CYAN}📝 Showing logs (Press Ctrl+C to stop all services)${NC}"
echo -e "${PURPLE}Backend logs will be prefixed with [BACKEND]${NC}"
echo -e "${CYAN}Frontend logs will be prefixed with [FRONTEND]${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to handle cleanup on script termination
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$TAIL_PID" ]; then
        kill $TAIL_PID 2>/dev/null
    fi
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Display logs from both services with colored prefixes
(tail -f $BACKEND_LOG | sed "s/^/\x1b[0;35m[BACKEND]\x1b[0m /" &
 tail -f $FRONTEND_LOG | sed "s/^/\x1b[0;36m[FRONTEND]\x1b[0m /" &
 wait) &
TAIL_PID=$!

# Wait for processes to finish
wait
