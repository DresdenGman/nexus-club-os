#!/usr/bin/env python3
"""Seed script: Create president accounts + clubs from Excel list.
Run: python3 server/seed.py
Requires: pypinyin, openpyxl
"""

import openpyxl, hashlib, uuid, json, sys, os, re, requests
from datetime import datetime, timezone

# === Read Supabase key from server/.env ===
env_path = os.path.join(os.path.dirname(__file__), '.env')
supabase_url = ''
supabase_key = ''

with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith('SUPABASE_URL='):
            supabase_url = line.split('=', 1)[1].strip()
        elif line.startswith('SUPABASE_ANON_KEY='):
            supabase_key = line.split('=', 1)[1].strip()

if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not found in server/.env")
    sys.exit(1)

HEADERS = {
    'apikey': supabase_key,
    'Authorization': f'Bearer {supabase_key}',
    'Content-Type': 'application/json',
}

def supabase_post(table, data):
    r = requests.post(f'{supabase_url}/rest/v1/{table}', headers={**HEADERS, 'Prefer': 'return=representation'}, json=data, timeout=15)
    if r.status_code not in (200, 201):
        print(f"  ERROR POST {table}: {r.status_code} {r.text[:200]}")
        return None
    return r.json()

def supabase_get(table, col, val):
    r = requests.get(f'{supabase_url}/rest/v1/{table}?{col}=eq.{val}', headers={**HEADERS, 'Accept': 'application/json'}, timeout=10)
    data = r.json() if r.status_code == 200 else []
    return data[0] if data else None

# === Password hashing (matches auth.js) ===
def hash_password(password):
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac('sha512', password.encode(), salt.encode(), 10000, dklen=64).hex()
    return f'{salt}:{h}'

# === Pinyin generation ===
from pypinyin import pinyin, Style

def to_pinyin(name):
    """Convert Chinese name to pinyin email prefix"""
    # Remove grade info like '高二7'
    name = re.sub(r'\s*(高一|高二|高三|初一|初二|初三)\s*\d*', '', name)
    name = re.sub(r'[\u4e00-\u9fff]', lambda m: ''.join([p[0] for p in pinyin(m.group(), style=Style.NORMAL)]), name)
    name = re.sub(r'[^a-zA-Z]', '', name).lower()
    return name

# === Excel parsing ===
excel_path = '/Users/a24300/Downloads/北京王府学校2026—2027学年社团联合会概况6.24 .xlsx'
wb = openpyxl.load_workbook(excel_path)
ws = wb.active

current_category = ''
clubs = []
created_users = {}  # name -> uid, to handle duplicate presidents

for row in ws.iter_rows(min_row=2, max_row=48, values_only=True):
    seq = str(row[0] or '').strip()
    if not seq:
        continue
    cat = str(row[1] or '').strip()
    if cat:
        current_category = cat
    name_cn = str(row[2] or '').strip()
    name_en = str(row[3] or '').strip()
    presidents_raw = str(row[4] or '').strip()
    
    # Parse multiple presidents (e.g., "曹若水、马赫阳 高二5、7")
    president_names = []
    for part in re.split(r'[、,]', presidents_raw):
        part = part.strip()
        # Remove grade info
        name = re.sub(r'\s*(高一|高二|高三|初一|初二|初三)\s*\d*.*$', '', part).strip()
        if name and name not in president_names:
            president_names.append(name)
    
    clubs.append({
        'category': current_category,
        'name_cn': name_cn,
        'name_en': name_en,
        'presidents': president_names,
    })

# Remove header row and entries without presidents or name
clubs = [c for c in clubs if c['presidents'] and c['name_cn']]

# Category mapping
CATEGORY_MAP = {
    '艺术类': 'Arts',
    '人文社科类': 'Humanities',
    '学科类': 'Academic',
    '运动类': 'Sports',
    '社会实践类': 'Social Practice',
}

print(f'Found {len(clubs)} clubs to create\n')

# === Create clubs and presidents ===
for i, club in enumerate(clubs):
    cat_en = CATEGORY_MAP.get(club['category'], 'Other')
    desc = f"BRS {club['name_cn']} — {club['name_en']}"
    
    print(f'[{i+1}/{len(clubs)}] {club["name_cn"]} ({cat_en}) — Presidents: {", ".join(club["presidents"])}')
    
    club_data = {
        'name': club['name_cn'],
        'type': cat_en,
        'status': 'Active',
        'president_id': 'pending',
        'members_count': len(club['presidents']),
        'description': desc,
    }
    
    # Create club first
    result = supabase_post('clubs', club_data)
    if not result or len(result) == 0:
        print(f"  FAILED to create club")
        continue
    club_id = result[0]['id']
    
    # Create each president and membership
    for president_name in club['presidents']:
        if president_name in created_users:
            uid = created_users[president_name]
            print(f"  Pres: {president_name} (existing user)")
        else:
            email = f'{to_pinyin(president_name)}@brs.edu'
            password_hash = hash_password('brs2026')
            
            user_data = {
                'uid': str(uuid.uuid4()),
                'name': president_name,
                'username': president_name,
                'email': email,
                'password_hash': password_hash,
                'role': 'president',
                'department': None,
                'join_date': datetime.now(timezone.utc).isoformat(),
                'contribution': 0,
            }
            
            user_result = supabase_post('users', user_data)
            if not user_result or len(user_result) == 0:
                print(f"  FAILED to create user {president_name}")
                continue
            uid = user_result[0]['uid']
            created_users[president_name] = uid
            print(f"  Pres: {president_name} -> {email}")
        
        # Create membership
        membership_data = {
            'user_id': uid,
            'club_id': club_id,
            'role': 'president',
            'status': 'active',
        }
        supabase_post('memberships', membership_data)
    
    # Update club with first president_id
    if club['presidents']:
        first_pres = club['presidents'][0]
        if first_pres in created_users:
            requests.patch(
                f'{supabase_url}/rest/v1/clubs?id=eq.{club_id}',
                headers=HEADERS,
                json={'president_id': created_users[first_pres]}
            )

print(f'\nDone! Created {len(created_users)} presidents for {len(clubs)} clubs.')
print(f'All passwords: brs2026')
