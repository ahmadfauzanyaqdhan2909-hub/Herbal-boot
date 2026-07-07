import os
import glob
import shutil
from google.colab import drive

def activate_v7la():
    print("🤖 V7LA AUTO-PILOT BRIDGE v1.7.0")
    print("──────────────────────────────────")
    
    # 1. Mount Google Drive
    if not os.path.exists('/content/drive'):
        print("⟳ Mounting Google Drive...")
        drive.mount('/content/drive')
    
    # 2. Find Latest VPL-ZIP
    search_path = '/content/drive/MyDrive/V7LA-CLOUDPORT-*.zip'
    zip_files = glob.glob(search_path)
    
    if not zip_files:
        print("❌ Error: Tidak ditemukan file V7LA-CLOUDPORT-*.zip di Google Drive.")
        print("Tolong jalankan 'vpl-zip' di local dan upload ke root Google Drive Bapak.")
        return

    latest_zip = max(zip_files, key=os.path.getctime)
    print(f"📦 Menemukan Senjata Terbaru: {os.path.basename(latest_zip)}")

    # 3. Setup RAM-Disk Workspace
    workspace = '/content/v7la'
    if os.path.exists(workspace):
        print("⟳ Refreshing Workspace...")
        shutil.rmtree(workspace)
    
    os.makedirs(workspace)
    
    # 4. Extract
    print("⟳ Unleashing Suite to RAM-Disk...")
    os.system(f'unzip -qo "{latest_zip}" -d {workspace}')
    
    # 5. Native Linux Setup
    os.chdir(workspace)
    print("⟳ Injecting Linux Muscles (LanceDB)...")
    if os.path.exists('setup-colab.sh'):
        os.system('chmod +x setup-colab.sh && ./setup-colab.sh > /dev/null')
    
    # 6. Final Activation
    print("✅ V7LA AKTIF DI CLOUD!")
    print("──────────────────────────────────")
    os.system('node bin/v7la_status.js')

if __name__ == "__main__":
    activate_v7la()
