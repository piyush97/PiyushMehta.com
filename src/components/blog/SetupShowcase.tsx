import React, { useState } from 'react';

interface ConfigFile {
  id: string;
  name: string;
  path: string;
  description: string;
  language: string;
  content: string;
}

const SetupShowcase: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<string>('hyprland');

  const configFiles: ConfigFile[] = [
    {
      id: 'hyprland',
      name: 'Hyprland Config',
      path: '~/.config/hypr/hyprland.conf',
      description: 'Main Hyprland configuration with Omarchy defaults',
      language: 'bash',
      content: `# Learn how to configure Hyprland: https://wiki.hyprland.org/Configuring/

# Use defaults Omarchy defaults (but don't edit these directly!)
source = ~/.local/share/omarchy/default/hypr/autostart.conf
source = ~/.local/share/omarchy/default/hypr/bindings/media.conf
source = ~/.local/share/omarchy/default/hypr/bindings/tiling.conf
source = ~/.local/share/omarchy/default/hypr/bindings/utilities.conf
source = ~/.local/share/omarchy/default/hypr/envs.conf
source = ~/.local/share/omarchy/default/hypr/looknfeel.conf
source = ~/.local/share/omarchy/default/hypr/input.conf
source = ~/.local/share/omarchy/default/hypr/windows.conf
source = ~/.config/omarchy/current/theme/hyprland.conf

# Change your own setup in these files (and overwrite any settings from defaults!)
source = ~/.config/hypr/monitors.conf
source = ~/.config/hypr/input.conf
source = ~/.config/hypr/bindings.conf
source = ~/.config/hypr/envs.conf
source = ~/.config/hypr/autostart.conf`,
    },
    {
      id: 'bindings',
      name: 'Key Bindings',
      path: '~/.config/hypr/bindings.conf',
      description: 'Custom keyboard shortcuts and application launchers',
      language: 'bash',
      content: `# Application bindings
$terminal = uwsm app -- alacritty
$browser = uwsm app -- chromium --new-window --args --profile-directory=Default
$webapp = $browser --app

# Core applications
bindd = SUPER, return, Terminal, exec, $terminal
bindd = SUPER, F, File manager, exec, uwsm app -- nautilus --new-window
bindd = SUPER, B, Browser, exec, $browser
bindd = SUPER, M, Music, exec, uwsm app -- spotify
bindd = SUPER, N, Neovim, exec, $terminal -e nvim
bindd = SUPER, T, Activity, exec, $terminal -e btop
bindd = SUPER, D, Docker, exec, $terminal -e lazydocker
bindd = SUPER, G, Signal, exec, uwsm app -- signal-desktop
bindd = SUPER, C, Code Editor, exec, uwsm app -- /home/piyush/.local/bin/zed

# Web applications
bindd = SUPER, A, Perplexity, exec, $webapp="https://perplexity.com"
bindd = SUPER, S, SharePoint, exec, $webapp="https://opg.wfsaas.ca/workforce/Home.do?action=start"
bindd = SUPER, O, Outlook, exec, $webapp="https://outlook.com"
bindd = SUPER, E, Email, exec, $webapp="https://mail.proton.me"
bindd = SUPER, Y, YouTube, exec, $webapp="https://youtube.com/"
bindd = SUPER, X, X, exec, $webapp="https://x.com/"

# Screenshot and clipboard bindings
bindd = , Print, Screenshot (full), exec, copy-image --screenshot
bindd = SHIFT, Home, Screenshot (select), exec, copy-image --select
bindd = SUPER, Home, Save clipboard image, exec, paste-image`,
    },
    {
      id: 'alacritty',
      name: 'Terminal Config',
      path: '~/.config/alacritty/alacritty.toml',
      description: 'Alacritty terminal configuration with Omarchy theme',
      language: 'toml',
      content: `general.import = [ "~/.config/omarchy/current/theme/alacritty.toml" ]

[env]
TERM = "xterm-256color"

[font]
normal = { family = "CaskaydiaMono Nerd Font" }
bold = { family = "CaskaydiaMono Nerd Font" }
italic = { family = "CaskaydiaMono Nerd Font" }
size = 9

[window]
padding.x = 14
padding.y = 14
decorations = "None"
opacity = 0.98

[keyboard]
bindings = [
  { key = "F11", action = "ToggleFullscreen" }
]`,
    },
    {
      id: 'zshrc',
      name: 'Shell Config',
      path: '~/.zshrc',
      description: 'Zsh configuration with productivity enhancements',
      language: 'bash',
      content: `# Enable Powerlevel10k instant prompt
if [[ -r "\${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh" ]]; then
  source "\${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-\${(%):-%n}.zsh"
fi

export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME="powerlevel10k/powerlevel10k"

# Plugins
plugins=(
  git
  docker
  kubectl
  node
  npm
  yarn
  zsh-autosuggestions
  zsh-syntax-highlighting
  history-substring-search
)

source $ZSH/oh-my-zsh.sh

# User configuration
export EDITOR='nvim'
export BROWSER='chromium'

# Aliases
alias vim='nvim'
alias cat='bat'
alias ls='eza -la --icons'
alias ll='eza -la --icons'
alias tree='eza --tree --icons'
alias grep='rg'
alias find='fd'
alias docker-logs='lazydocker'
alias k='kubectl'

# Load additional configs
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh`,
    },
    {
      id: 'packages',
      name: 'Essential Packages',
      path: 'Essential Development Tools',
      description: 'Core packages that make this setup productive',
      language: 'bash',
      content: `# Core Development Tools
pacman -S base-devel git curl wget
pacman -S docker docker-compose docker-buildx
pacman -S nodejs npm yarn
pacman -S python python-pip
pacman -S go rust

# Terminal & Shell
pacman -S zsh alacritty
pacman -S bat eza fd ripgrep
pacman -S btop lazydocker
pacman -S neovim

# GUI Applications
pacman -S ungoogled-chromium
pacman -S nautilus
pacman -S spotify-launcher
pacman -S signal-desktop

# Development Tools
yay -S code-insiders-bin
yay -S claude-code
yay -S zed-editor

# Hyprland & Wayland
pacman -S hyprland waybar
pacman -S xdg-desktop-portal-hyprland
pacman -S wl-clipboard grim slurp

# Fonts
pacman -S noto-fonts noto-fonts-emoji
yay -S nerd-fonts-cascadia-code

# System Utilities
pacman -S bitwarden
pacman -S networkmanager
pacman -S pipewire pipewire-pulse
pacman -S bluez bluez-utils`,
    },
  ];

  const selectedFile = configFiles.find((f) => f.id === selectedConfig)!;

  const copyToClipboard = (content: string) => {
    void navigator.clipboard.writeText(content);
  };

  return (
    <div className="not-prose bg-surface-2 border border-border rounded-xl p-6 my-8">
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Configuration Showcase: Real Setup Files
      </h3>

      {/* File Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {configFiles.map((file) => (
          <button
            type="button"
            key={file.id}
            onClick={() => setSelectedConfig(file.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedConfig === file.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-1'
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Configuration Display */}
      <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-surface-3 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">{selectedFile.name}</h4>
              <p className="text-sm text-text-secondary">{selectedFile.path}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(selectedFile.content)}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-text-secondary mt-2">{selectedFile.description}</p>
        </div>

        {/* Code Content */}
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm text-text-primary bg-surface-1">
            <code className={`language-${selectedFile.language}`}>{selectedFile.content}</code>
          </pre>
        </div>
      </div>

      {/* Configuration Tips */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h5 className="font-medium text-blue-600 mb-2">💡 Configuration Tips</h5>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Start with Omarchy defaults, then customize</li>
            <li>• Keep configurations in version control</li>
            <li>• Test changes in a separate config first</li>
            <li>• Document your customizations</li>
          </ul>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <h5 className="font-medium text-green-600 mb-2">🔧 Best Practices</h5>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Use meaningful keybinding mnemonics</li>
            <li>• Backup configs before major changes</li>
            <li>• Learn one tool at a time thoroughly</li>
            <li>• Join the Omarchy community for help</li>
          </ul>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-4 text-sm text-text-secondary bg-surface-1 border border-border rounded-lg p-4">
        <h5 className="font-medium text-text-primary mb-2">System Specifications</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Hardware:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Intel NUC13ANKi7</li>
              <li>Intel i7-1360P (8+8 cores)</li>
              <li>16GB DDR4 RAM</li>
              <li>500GB NVMe SSD</li>
              <li>Dual 32" 4K monitors</li>
            </ul>
          </div>
          <div>
            <strong>Software:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Arch Linux (rolling)</li>
              <li>Zen kernel 6.16.3</li>
              <li>Hyprland 0.50.1</li>
              <li>Omarchy v2.0.0</li>
              <li>896 installed packages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupShowcase;
