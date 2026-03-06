# Monev - Process Management Scripts

## Quick Start

### Windows
```bash
# Run the kill script
.\kill-node.bat

# Or use PowerShell
taskkill /F /IM node.exe
```

### Linux/Mac
```bash
# Make script executable
chmod +x kill-node.sh

# Run the kill script
./kill-node.sh

# Or use command directly
pkill -9 node
```

## Available Scripts

### kill-node.bat (Windows)
- Kills all Node.js processes
- Shows list of processes before killing
- Cleans up port conflicts
- **Usage**: Double-click or run in CMD

### kill-node.sh (Linux/Mac/WSL)
- Kills all Node.js processes
- Shows list of processes before killing
- Cleans up port conflicts
- **Usage**: `./kill-node.sh`

### npm Scripts

```bash
# Kill processes and restart dev server
npm run dev:clean

# Just kill processes
npm run kill
```

## Common Issues

### Port 3000 already in use
```bash
# Windows
.\kill-node.bat

# Linux/Mac
./kill-node.sh

# Then restart
npm run dev
```

### Process won't die
```bash
# Windows (run as admin)
taskkill /F /IM node.exe

# Linux/Mac (with sudo)
sudo pkill -9 node
```

### Find what's using a port
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Then kill by PID
taskkill /F /PID <PID>        # Windows
kill -9 <PID>                 # Linux/Mac
```

## NPM Scripts Added to package.json

```json
{
  "scripts": {
    "kill": "taskkill /F /IM node.exe",
    "dev:clean": "npm run kill && npm run dev",
    "dev:reset": "npm run kill && rm -rf .next && npm run dev"
  }
}
```

## Best Practices

1. **Always kill processes** before starting dev server
2. **Clean cache** if you see weird errors
3. **Use scripts** instead of manual commands
4. **Run as admin** if processes won't die

## Troubleshooting

### Script doesn't work on Windows?
- Run Command Prompt as Administrator
- Or right-click `kill-node.bat` → "Run as administrator"

### Script doesn't work on Linux/Mac?
- Make executable: `chmod +x kill-node.sh`
- Run with sudo: `sudo ./kill-node.sh`

### Still having issues?
```bash
# Full reset
npm run kill
rm -rf .next node_modules/.cache
npm install
npm run dev
```

## Shortcuts

| OS | Command | Description |
|----|---------|-------------|
| Windows | `.\kill-node.bat` | Kill all Node processes |
| Linux/Mac | `./kill-node.sh` | Kill all Node processes |
| Any | `npm run kill` | Quick kill via npm |
| Any | `npm run dev:clean` | Kill + restart dev |
| Any | `npm run dev:reset` | Full reset + restart |

---

**Created**: March 6, 2026  
**Version**: 1.0  
**Compatible**: Windows, Linux, Mac, WSL
