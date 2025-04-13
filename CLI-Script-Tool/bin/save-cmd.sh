#!/usr/bin/env bash

# force history to be written to file
history -a

# try to find history file
HISTORY_FILE="${HISTFILE:-$HOME/.bash_history}"

if [ -f "$HISTORY_FILE" ]; then
  # find the most recent command that's not 'cmd-saver'
  PREV_CMD=$(grep -v "cmd-saver" "$HISTORY_FILE" | tail -n 1)

  # if we found a command, use it
  if [ -n "$PREV_CMD" ]; then
    echo "Found previous command: $PREV_CMD"
  else
    echo "No suitable previous command found"
    PREV_CMD=""
  fi
else
  echo "History file not found"
  PREV_CMD=""
fi

# pass to node script (with or without the command)
node "$(dirname "$0")/../lib/index.js" "$PREV_CMD"