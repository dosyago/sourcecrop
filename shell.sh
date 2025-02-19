#!/bin/bash

_sc_completions() {
  local cur prev LASTCHAR=' ' IFS=$'\n'
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  # If we are on the first argument, complete file and directory names
  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -o plusdirs -f -- "${cur}") )

    # Handle single completion case
    if [ ${#COMPREPLY[@]} = 1 ]; then
      local expanded="${COMPREPLY[0]/#\~/$HOME}"
      [ -d "$expanded" ] && LASTCHAR='/'
      COMPREPLY="${COMPREPLY[0]}${LASTCHAR}"
    else
      for ((i=0; i < ${#COMPREPLY[@]}; i++)); do
        local expanded="${COMPREPLY[$i]/#\~/$HOME}"
        [ -d "$expanded" ] && COMPREPLY[$i]="${COMPREPLY[$i]}/"
      done
    fi

    return 0
  fi

  local js_file="${COMP_WORDS[1]}"

  # Handle autocomplete for the 'calls-' prefix
  if [[ $COMP_CWORD -eq 2 && $cur == calls-* ]]; then
    local prefix="calls-"
    local typed="${cur#calls-}"
    local opts
    opts=$(sc "${js_file}" -listCallees 2>/dev/null)
    if [[ $? -eq 0 ]]; then
      COMPREPLY=( $(compgen -W "${opts}" -- "${typed}") )
      COMPREPLY=( "${COMPREPLY[@]/#/calls-}" )
    else
      COMPREPLY=("Error reading callees")
    fi
    return 0
  fi

  # Handle autocomplete for the 'by-' prefix
  if [[ $COMP_CWORD -eq 2 && $cur == by-* ]]; then
    local prefix="by-"
    local typed="${cur#by-}"
    local opts
    opts=$(sc "${js_file}" -listCallers 2>/dev/null)  # Assuming -listCallers would give us a list of functions
    if [[ $? -eq 0 ]]; then
      COMPREPLY=( $(compgen -W "${opts}" -- "${typed}") )
      COMPREPLY=( "${COMPREPLY[@]/#/by-}" )
    else
      COMPREPLY=("Error reading callers")
    fi
    return 0
  fi

  # Handle autocomplete for function names that are called by the selected function
  if [[ $COMP_CWORD -eq 3 && ${COMP_WORDS[2]} == by-* ]]; then
    local caller="${COMP_WORDS[2]#by-}"
    local typed="${cur}"
    local opts
    opts=$(sc "${js_file}" "by-${caller}" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
      COMPREPLY=( $(compgen -W "${opts}" -- "${typed}") )
    else
      COMPREPLY=("Error reading callees")
    fi
    return 0
  fi

  # Handle autocomplete for function names that are called by the selected function
  if [[ $COMP_CWORD -eq 3 && ${COMP_WORDS[2]} == calls-* ]]; then
    local callee="${COMP_WORDS[2]#calls-}"
    local typed="${cur}"
    local opts
    opts=$(sc "${js_file}" "calls-${callee}" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
      COMPREPLY=( $(compgen -W "${opts}" -- "${typed}") )
    else
      COMPREPLY=("Error reading callers")
    fi
    return 0
  fi

  # If we are on the second argument, complete with items from the JS file
  if [[ $COMP_CWORD -eq 2 && -n ${js_file} ]]; then
    local opts
    opts=$(sc "${js_file}" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
      COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    else
      COMPREPLY=("Error reading items")
    fi
  fi
}

complete -r sc &>/dev/null
complete -o nospace -F _sc_completions sc

