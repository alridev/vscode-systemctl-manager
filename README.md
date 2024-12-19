# Systemctl Manager for VS Code

A powerful systemd service manager extension for Visual Studio Code that allows you to manage your systemd services directly from the editor.

## Features

- 🔍 View all systemd services with their current status
- ⭐ Add services to favorites for quick access
- 🎮 Control services (start, stop, restart)
- 📝 View and edit service configuration files
- 📊 Monitor service status in real-time
- 🔄 Reload systemd daemon
- 🔍 Search and filter services
- 📋 View service logs directly in VS Code

## Requirements

- Linux operating system
- systemd
- Appropriate permissions to manage services (sudo access)

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Systemctl Manager"
4. Click Install

## Usage

### Basic Operations

- Click the Systemctl Manager icon in the activity bar to view services
- Use the context menu (right-click) on a service to:
  - Start/Stop/Restart service
  - Add to favorites
  - View logs
  - Edit configuration
  - Enable/Disable service

### Favorites

- Right-click a service and select "Toggle Favorite" to add it to favorites
- Favorite services appear at the top of the list
- Reorder favorites by dragging them

### Service Configuration

- Right-click a service and select "Open Configuration" to view/edit its configuration file
- After editing, use "Reload Daemon" to apply changes

### Logs

- View service logs directly in VS Code terminal
- Real-time log updates using journalctl

## Extension Settings

This extension contributes the following settings:

* `systemctlManager.enableDebugLogs`: Enable/disable debug logging
* `systemctlManager.autoRefreshInterval`: Set auto-refresh interval for service status

## Known Issues

See [GitHub Issues](https://github.com/your-username/vscode-systemctl/issues)

## Release Notes

### 0.0.1

Initial release:
- Basic service management
- Favorites support
- Service logs viewing
- Configuration editing
- Status monitoring

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the [MIT License](LICENSE). 