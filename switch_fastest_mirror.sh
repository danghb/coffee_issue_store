#!/bin/bash

# Definition of candidate mirrors
# Format: "MirrorURL"
MIRRORS=(
    "docker.m.daocloud.io"
    "docker.1panel.live"
    "docker.xuanyuan.me"
    "docker.udayun.com"
    "docker.rainbond.cc"
    "dockerhub.jobcher.com"
    "docker.mirrors.sjtug.sjtu.edu.cn"
    "docker.mirrors.ustc.edu.cn"
    "docker.nju.edu.cn"
)

echo "🚀 Starting Docker mirror speed test..."
echo "----------------------------------------"

FASTEST_MIRROR=""
MIN_TIME=999999

for MIRROR in "${MIRRORS[@]}"; do
    # measure time to connect and get response (in seconds)
    echo -n "Testing $MIRROR ... "
    
    # We test connecting to the v2 endpoint. 
    # Use max-time to skip timeouts quickly.
    TIME=$(curl -o /dev/null -s -w "%{time_total}\n" --max-time 3 "https://$MIRROR/v2/")
    
    RET_CODE=$?
    
    if [ $RET_CODE -eq 0 ]; then
        echo "${TIME}s"
        
        # Compare floating point numbers using awk
        IS_FASTER=$(awk "BEGIN {print ($TIME < $MIN_TIME)}")
        
        if [ "$IS_FASTER" -eq 1 ]; then
            MIN_TIME=$TIME
            FASTEST_MIRROR=$MIRROR
        fi
    else
        echo "Failed/Timeout"
    fi
done

echo "----------------------------------------"

if [ -z "$FASTEST_MIRROR" ]; then
    echo "❌ No working mirrors found. Please check your network connection."
    exit 1
fi

echo "✅ Fastest mirror identified: $FASTEST_MIRROR (Time: ${MIN_TIME}s)"
echo "📝 Updating Dockerfiles..."

# Function to replace mirror in Dockerfile
# It looks for patterns like "FROM .*node:20-alpine" and replaces the prefix
update_dockerfile() {
    FILE=$1
    if [ ! -f "$FILE" ]; then
        echo "Warning: $FILE not found, skipping."
        return
    fi
    
    # Backup
    cp "$FILE" "${FILE}.bak"
    
    # Replace for node:20-alpine
    # Logic: Replace any existing registry prefix or 'docker.io' or just 'node:20-alpine' 
    # with 'FASTEST_MIRROR/node:20-alpine'
    # We find lines starting with FROM, containing node:20-alpine, and replace the whole image part
    sed -i "s|FROM .*node:20-alpine|FROM ${FASTEST_MIRROR}/node:20-alpine|g" "$FILE"
    
    # Replace for nginx:alpine
    sed -i "s|FROM .*nginx:alpine|FROM ${FASTEST_MIRROR}/nginx:alpine|g" "$FILE"
    
    echo "   Updated $FILE"
}

update_dockerfile "backend/Dockerfile"
update_dockerfile "docker/Dockerfile.nginx"

echo "----------------------------------------"
echo "🎉 Done! You can now run: sudo docker compose build --no-cache"
