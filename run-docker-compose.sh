INTERVAL=2

echo "Starting Docker info monitoring loop... Press [CTRL+C] to stop."

until wget -O- http://dind-daemon:2375/_ping > /dev/null 2>&1; do
    wget -O- http://dind-daemon:2375/_ping
    echo "waiting for $INTERVAL seconds before trying again"
    # Wait for the specified interval before running again
    sleep "$INTERVAL"
done

exec docker compose up --quiet-build --quiet-pull
