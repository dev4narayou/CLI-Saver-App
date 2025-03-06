#!/usr/bin/env bash

# force history to be written to file
history -a

# get the previous command
PREV_CMD=$(history | tail -n 2 | head -n 1 | sed 's/^ *[0-9]* *//')

# pass it to the node
node "$(dirname "$0")/../lib/index.js" "$PREV_CMD"

