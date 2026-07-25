import os
import shutil

# Path to the Downloads folder
downloads_path = os.path.expanduser("~/Downloads")

# Define target directories and their corresponding keywords/extensions
categories = {
    "Stocks_Analysis": {
        "extensions": [".xlsx", ".xls"],
        "keywords": ["Bank", "Motors", "Inds", "Ltd", "Unilever", "Infosys", "ITC", "Wipro", "Asian Paints", "Bajaj", "Cements", "Copper", "Gillette", "Havells", "JSW", "P & G", "Sanofi", "SIS", "Symphony", "TTK", "United Spirits", "V I P", "Whirlpool", "Colgate", "Dabur", "Dixon", "Finolex", "Glaxosmi", "Gujarat Gas", "ICICI", "Page Industries", "Tasty Bite"],
    },
    "Training_Dashboards": {
        "extensions": [".xlsx", ".xls", ".pptx", ".ppt", ".pdf"],
        "keywords": ["training", "dashboard", "analysis", "performance", "impact", "telemetry", "report", "roadmap", "socrates"],
    },
    "Installers": {
        "extensions": [".dmg", ".pkg", ".exe", ".msi"],
        "keywords": [],
    },
    "Pine_Scripts": {
        "extensions": [".pine"],
        "keywords": [],
    },
    "Media": {
        "extensions": [".mp4", ".m4a", ".heic", ".png", ".jpg", ".jpeg", ".mov"],
        "keywords": [],
    },
    "Documents": {
        "extensions": [".pdf", ".md", ".html", ".txt", ".docx", ".doc"],
        "keywords": [],
    },
    "Archives": {
        "extensions": [".zip", ".rar", ".7z", ".gz", ".tar"],
        "keywords": [],
    }
}

def organize():
    # Create target directories if they don't exist
    for category in categories:
        cat_path = os.path.join(downloads_path, category)
        if not os.path.exists(cat_path):
            os.makedirs(cat_path)

    # List all files in Downloads
    files = [f for f in os.listdir(downloads_path) if os.path.isfile(os.path.join(downloads_path, f))]

    for file in files:
        if file.startswith(".") or file == "organize_downloads.py":
            continue

        file_path = os.path.join(downloads_path, file)
        file_ext = os.path.splitext(file)[1].lower()
        file_name_lower = file.lower()

        moved = False

        # Check for Training/Dashboards first as they are more specific
        for cat_name, criteria in categories.items():
            if cat_name == "Training_Dashboards":
                if any(kw in file_name_lower for kw in criteria["keywords"]):
                    shutil.move(file_path, os.path.join(downloads_path, cat_name, file))
                    moved = True
                    break

        if moved: continue

        # Check for Stocks_Analysis
        for cat_name, criteria in categories.items():
            if cat_name == "Stocks_Analysis":
                # If it's an excel file and matches a stock keyword or just looks like a stock file
                # Many of your files have stock names but not necessarily "Ltd" or "Bank" in name
                if file_ext in criteria["extensions"]:
                    # Heuristic: If it's in the list or common stock patterns
                    if any(kw.lower() in file_name_lower for kw in criteria["keywords"]):
                        shutil.move(file_path, os.path.join(downloads_path, cat_name, file))
                        moved = True
                        break
        
        if moved: continue

        # Categorize by extension for others
        for cat_name, criteria in categories.items():
            if file_ext in criteria["extensions"]:
                shutil.move(file_path, os.path.join(downloads_path, cat_name, file))
                moved = True
                break
        
        # If no category matched, move to "Misc"
        if not moved:
            misc_path = os.path.join(downloads_path, "Misc")
            if not os.path.exists(misc_path):
                os.makedirs(misc_path)
            shutil.move(file_path, os.path.join(misc_path, file))

    print("Downloads folder organized successfully!")

if __name__ == "__main__":
    organize()
