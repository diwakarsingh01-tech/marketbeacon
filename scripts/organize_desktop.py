import os
import shutil

# Path to the Desktop folder
desktop_path = os.path.expanduser("~/Desktop")

# Folders to check/create
folders = {
    "Screenshots": ["screenshot", ".png", ".jpg", ".jpeg"],
    "Office": [".pptx", ".ppt", ".xlsx", ".xls"],
    "Documents": [".pdf", ".docx", ".doc", ".txt", ".md"],
    "Misc": []
}

def organize():
    # Ensure standard folders exist
    for folder in folders:
        path = os.path.join(desktop_path, folder)
        if not os.path.exists(path):
            os.makedirs(path)

    # List only files on Desktop
    files = [f for f in os.listdir(desktop_path) if os.path.isfile(os.path.join(desktop_path, f))]

    for file in files:
        if file.startswith(".") or file == "organize_desktop.py":
            continue

        file_path = os.path.join(desktop_path, file)
        file_ext = os.path.splitext(file)[1].lower()
        file_name_lower = file.lower()

        moved = False

        # Move screenshots specifically
        if file_name_lower.startswith("screenshot") or any(ext in file_ext for ext in [".png", ".jpg", ".jpeg"]):
            shutil.move(file_path, os.path.join(desktop_path, "Screenshots", file))
            moved = True
        
        # Move office docs
        elif any(ext in file_ext for ext in [".pptx", ".ppt", ".xlsx", ".xls"]):
            shutil.move(file_path, os.path.join(desktop_path, "Office", file))
            moved = True

        # Move other documents
        elif any(ext in file_ext for ext in [".pdf", ".docx", ".doc", ".txt", ".md"]):
            shutil.move(file_path, os.path.join(desktop_path, "Documents", file))
            moved = True
        
        # Move to Misc if nothing else
        else:
            shutil.move(file_path, os.path.join(desktop_path, "Misc", file))

    print("Desktop folder organized successfully!")

if __name__ == "__main__":
    organize()
