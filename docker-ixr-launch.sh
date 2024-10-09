#!/usr/bin/bash

allowed_vars=("NPM_TOKEN")
# Check if ixr_envs is set if it is, then transfer the environment vars
if [ -n "$ixr_envs" ]; then
    while IFS='=' read -r name value; do
        # Check if both name and value are set
        if [ -n "$name" ] && [ -n "$value" ]; then
            # Skip lines that begin with '#'
            if [[ $name =~ ^#.* ]] || ( [[ ${allowed_vars[0]} != "ALL" ]] && [[ ! " ${allowed_vars[@]} " =~ " ${name} " ]] ); then
                continue
            fi
            # Export each name-value pair as an environment variable, handling the case where value contains spaces or special characters
            eval "export $name='$value'"
        fi
    done <<< "$ixr_envs"
    unset ixr_envs   
fi

NUM_WORKERS=${NUM_WORKERS:-5}

# Initialize variables to track the presence of each parameter
launch_prod=true
launch_dev=false
launch_debug=false
launch_skip=false
launch_skipall=false

# Loop through the command-line arguments
for arg in "$@"; do
    case $arg in
        --debug)
            launch_debug=true
            NUM_WORKERS=1
            ;;
        --dev)
            launch_dev=true
            NUM_WORKERS=1
            ;;
        --prod)
            launch_prod=true
            launch_dev=false
            launch_debug=false
            ;;
        --skip)
            launch_skip=true
            ;;
        --skipall)
            launch_skipall=true
            ;;
        *)
            echo "Unknown option: $arg (ignored)"
            ;;
    esac
done

if $launch_skipall; then
    echo "Skipped normal launch. Waiting for further instructions"
    tail -f /dev/null
    #sleep infinity
else
    # Perform actions we always want to do (except during --skipall)
    echo "Setting up the base environment..."
    
    if $launch_skip; then
        echo "Launch mode: SKIPPED!"
    elif $launch_debug; then
        echo "Launch mode: DEBUG..." #same as dev mode
        cd /opt/informxr/shell 
        ./packagelib.sh --no-publish
        cd /opt/informxr
        tail -f /dev/null
    elif $launch_dev; then
        echo "Launch mode: DEV..."
        cd /opt/informxr/shell 
        ./packagelib.sh --no-publish
        cd /opt/informxr
        tail -f /dev/null
    elif $launch_prod; then
        echo "Launch mode: PROD..."
        cd /opt/informxr/shell 
        ./packagelib.sh
        cd /opt/informxr
        #echo "Keeping the process open. Use 'docker exec' to run commands if needed."
        #tail -f /dev/null
    fi
fi