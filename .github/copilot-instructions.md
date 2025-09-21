# Aktualne Instrukcje PKP - GitHub Copilot Instructions

This is a Polish railway instruction scraper and web interface that fetches PKP (Polish Railways) instruction documents and provides a searchable web interface.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup
- Python 3.12+ is required
- Install dependencies: `pip install -r requirements.txt`
  - Required packages: `requests` and `beautifulsoup4`
- No additional build tools or compilers needed

### Core Scripts and Commands
- **Main data scraper**: `python getData.py`
  - **CRITICAL**: Script requires internet access to `www.plk-sa.pl` 
  - **TIMING**: Script takes 10-30 seconds when internet is available. NEVER CANCEL - set timeout to 60+ seconds.
  - **EXPECTED BEHAVIOR**: Will fail in sandboxed environments without internet access with `ConnectionError` - this is normal
  - Creates/updates JSON files in `allFiles/` and `currentFiles/` directories
- **Web interface**: `python -m http.server 8080` (run from `web/` directory)
  - Serves the search interface on http://localhost:8080
  - **VALIDATION**: Always test both index.html and stats.html pages load correctly

### Data Structure
- `allFiles/`: Contains complete instruction history with all versions
  - `automatyka-i-telekomunikacja.json`: Automation/telecommunications instructions
  - `ruch-i-przewozy-kolejowe.json`: Traffic/transport instructions
- `currentFiles/`: Contains only the latest versions of each instruction
- **JSON Structure**: Each file contains array of instructions with `number`, `versions` array containing `name`, `number`, `resource_url`, `wcag`, `from_date`, `to_date`

### GitHub Actions Automation
- **Workflow**: `.github/workflows/main.yml` runs every 2 days at 05:00 UTC
- **NEVER CANCEL**: Automated runs take 30-60 seconds. Always set timeouts to 120+ seconds for workflow testing.
- **Expected Output**: Updates JSON files and commits changes automatically

## Testing and Validation

### Python Script Validation
- **Syntax check**: `python -m py_compile getData.py`
- **Expected failure in sandbox**: Script will fail with `ConnectionError` when no internet access - this is normal behavior
- **Timing test**: Script startup takes ~0.1 seconds, full execution with internet takes 10-30 seconds

### Web Interface Validation
- **MANDATORY**: Always test the complete web interface functionality:
  1. Start server: `cd web && python -m http.server 8080`
  2. **CRITICAL VALIDATION SCENARIOS**:
     - Test main page loads: `curl -s -w "%{http_code}" http://localhost:8080/` should return `200`
     - Test stats page loads: `curl -s -w "%{http_code}" http://localhost:8080/stats.html` should return `200`
     - **MANUAL TESTING**: Open browser to http://localhost:8080 and verify:
       - Search interface displays correctly
       - Dark mode toggle works (moon/sun icon in top right)
       - Autocomplete suggestions appear when typing (uses existing JSON data)
       - Stats page shows instruction statistics
- **NEVER CANCEL**: Web server startup is instant, testing takes 1-2 minutes total

### Data Validation
- **JSON integrity**: `python -c "import json; json.load(open('allFiles/automatyka-i-telekomunikacja.json'))"`
- **Data structure**: Each JSON file should contain array of instruction objects with proper structure
- **File sizes**: allFiles/ JSONs are typically 20-80KB, currentFiles/ are smaller (10-40KB)

## Common Tasks

### Running the Application
1. **Setup environment**: `pip install -r requirements.txt`
2. **Serve web interface**: `cd web && python -m http.server 8080`
3. **Access application**: Open http://localhost:8080 in browser
4. **VALIDATION**: Test search functionality and verify data loads correctly

### Development Workflow
- **Code changes**: Always validate Python syntax with `python -m py_compile getData.py`
- **Web changes**: Test locally with HTTP server before committing
- **Data updates**: Script runs automatically via GitHub Actions, manual runs require internet access
- **NEVER**: Commit __pycache__ directories or .pyc files (included in .gitignore)

### Troubleshooting
- **ConnectionError in getData.py**: Expected in sandboxed environments - script requires external internet access
- **Empty JSON files**: Indicates scraper couldn't access source website or structure changed
- **Web interface not loading**: Check if HTTP server is running and port 8080 is available
- **Missing CSS/JS**: Ensure you're serving from `web/` directory, not repository root

## File Structure Reference

### Repository Root
```
├── .github/
│   ├── workflows/main.yml    # Automated scraper workflow
│   └── dependabot.yml        # Dependency updates
├── .gitignore               # Excludes Python cache files
├── README.md                # Basic project description
├── requirements.txt         # Python dependencies
├── getData.py              # Main scraper script
├── allFiles/               # Complete instruction data
│   ├── automatyka-i-telekomunikacja.json
│   └── ruch-i-przewozy-kolejowe.json
├── currentFiles/           # Latest versions only
│   ├── automatyka-i-telekomunikacja.json
│   └── ruch-i-przewozy-kolejowe.json
└── web/                   # Frontend interface
    ├── index.html         # Main search interface
    ├── stats.html         # Statistics page
    ├── utils.js           # JavaScript utilities
    ├── style.css          # Main styles
    ├── darkmode.css       # Dark mode styles
    └── stats-extra.css    # Additional stats styles
```

### Key Dependencies
- **Python**: 3.12+ (uses modern type hints like `str | None`)
- **requests**: HTTP client for web scraping
- **beautifulsoup4**: HTML parsing for instruction extraction
- **No build tools**: Pure Python script, no compilation needed

## CRITICAL REMINDERS
- **NEVER CANCEL**: All network operations and builds - allow full timeout periods
- **VALIDATION REQUIRED**: Always test web interface functionality manually after changes
- **INTERNET DEPENDENCY**: getData.py requires external internet access to function
- **TIMING EXPECTATIONS**: 
  - Script execution: 10-30 seconds with internet, fails immediately without
  - Web server startup: Instant
  - Testing complete workflow: 2-3 minutes total
- **TIMEOUT VALUES**: Always use 60+ seconds for getData.py, 120+ seconds for GitHub Actions testing