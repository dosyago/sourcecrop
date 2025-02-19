#!/usr/bin/env bash

# Function to check if bat is installed
check_bat_installed() {
  if command -v bat &> /dev/null; then
    echo "bat is already installed."
  else
    echo "bat is not installed. Installing bat..."

    case "$(uname -s)" in
      Linux)
        if [ -x "$(command -v apt-get)" ]; then
          sudo apt-get update && sudo apt-get install -y bat
        elif [ -x "$(command -v yum)" ]; then
          sudo yum install -y bat
        elif [ -x "$(command -v pacman)" ]; then
          sudo pacman -S bat
        else
          echo "Unsupported Linux package manager. Please install bat manually."
          exit 1
        fi
        ;;
      Darwin)
        if [ -x "$(command -v brew)" ]; then
          brew install bat
        else
          echo "Homebrew is not installed. Please install Homebrew first or install bat manually."
          exit 1
        fi
        ;;
      CYGWIN*|MINGW32*|MSYS*|MINGW*)
        if [ -x "$(command -v scoop)" ]; then
          echo "Installing bat using Scoop..."
          scoop install bat || { echo "Failed to install bat using Scoop."; exit 1; }
        else
          echo "Scoop is not installed. Please install Scoop first or install bat manually."
          exit 1
        fi
        ;;
      *)
        echo "Unsupported OS. Please install bat manually."
        exit 1
        ;;
    esac
  fi
}

# Ensure bat is installed
check_bat_installed

mkdir -p ~/.config/dosaygo/sc/
cp shell.sh ~/.config/dosaygo/sc/completion.sh
chmod +x ~/.config/dosaygo/sc/completion.sh
if ! grep -q 'sc/completion.sh' ~/.bashrc; then
  echo 'source ~/.config/dosaygo/sc/completion.sh' >> ~/.bashrc
fi

sudo ln -sf "$(pwd)/sc.js" "/usr/local/bin/sc"
complete -r sc &>/dev/null
unset -f _sc_completions
. ~/.config/dosaygo/sc/completion.sh
echo "Installed source crop. Use as: sc"
echo "(You may need to restart your shell first)" >&2
exec bash


