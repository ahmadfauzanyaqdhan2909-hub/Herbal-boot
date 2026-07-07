# V7LA MASTER NEXUS — Omni-Vector Protocol
# Status: NEXUS ACTIVE | Project: Edukita

## [PASAL 1] NEXUS TOOL DISPATCHER
Setiap instruksi harus dirouting ke TEPAT SATU alat. Ikuti tabel:

| Jenis Task | Tool | DILARANG |
|---|---|---|
| Cari pattern/snippet kode | LanceDB vector | grep seluruh repo |
| Cari teks literal (error/var) | grep native | LanceDB |
| Hubungan antar file & logika | MCP Memory search_nodes | Baca manual semua file |
| Docs library (React, Drizzle) | Context-7 (prefer cache) | Web search |
| Keputusan arsitektur lama | MCP Memory + SQLite | Baca vault .md lama |
| Testing kode baru | opencode sandbox | Langsung edit project |
| Tracking build/deploy | SQLite Auditor | Console.log |

## [PASAL 2] LAZY-LOAD PRINCIPLE
- DILARANG dump seluruh schema ke context.
- Fetch HANYA data yang relevan dengan task saat ini.
- Gunakan LanceDB: "cari pattern mirip [task ini]"
- Gunakan MCP Memory: "kontrak API endpoint [X]"

## [PASAL 3] KARPATHY CODING LAWS
- Think Before Coding: Tanya jika ambigu.
- Simplicity First: Kode minimal, zero abstraksi prematur.
- Surgical Changes: Hanya sentuh baris yang harus diubah.

## [PASAL 4] TRIPLE PERSISTENCE
Setelah setiap sub-task selesai:
1. Pattern reusable → simpan ke LanceDB
2. Kontrak API berubah → update MCP Memory
3. Log aksi → insert ke SQLite Auditor (build_log/session_log)
