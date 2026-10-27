"""
SignBridge AI - ASL Illustrated PDF Guide Generator
Generates a complete, publication-grade Persian PDF guide with visual hand gesture diagrams.
"""

import os
import json
import subprocess
import numpy as np
from ml.data.dataset_generator import CANONICAL_HAND_POSES

SIGNS_INFO = {
    "HELLO": {
        "title_fa": "سلام / درود",
        "title_en": "HELLO",
        "category_fa": "احوال‌پرسی (Greeting)",
        "hand_type_fa": "یک دستی (دست غالب)",
        "badge_color": "#3B82F6",
        "motion_fa": "حرکت دست باز از کنار پیشانی به سمت بیرون (مشابه ادای احترام)",
        "handshape_fa": "فرم دست باز (Flat-B Hand): هر ۴ انگشت (اشاره، میانی، حلقه و کوچک) کاملاً صاف، کشیده و به هم چسبیده‌اند. انگشت شست به صورت طبیعی در کنار دست باز است.",
        "palm_dir_fa": "رو به وب‌کم / مخاطب، با زاویه کمی مایل به بالا.",
        "ai_tip_fa": "انگشتان را از هم فاصله ندهید؛ چسبیده بودن ۴ انگشت به هم شاخصه تفکیک آن از حالت خنثی و باز است.",
        "arrow": '<path d="M 180 80 Q 220 70 230 40" stroke="#06B6D4" stroke-width="4" fill="none" marker-end="url(#arrowhead)"/><text x="180" y="35" fill="#06B6D4" font-size="11" font-weight="bold">حرکت به بیرون ↗</text>'
    },
    "THANK_YOU": {
        "title_fa": "متشکرم / سپاس",
        "title_en": "THANK YOU",
        "category_fa": "ادب و احترام (Courtesy)",
        "hand_type_fa": "یک دستی",
        "badge_color": "#10B981",
        "motion_fa": "حرکت دست از نزدیکی چانه به سمت جلو و مخاطب",
        "handshape_fa": "دست کاملاً صاف و باز با انگشتان چسبیده به هم. نوک انگشتان ابتدا نزدیک چانه/لب‌ها قرار دارد و سپس با متانت به سمت جلو و مخاطب امتداد می‌یابد.",
        "palm_dir_fa": "در شروع رو به چانه و در امتداد به سمت جلو و کمی بالا رو به مخاطب.",
        "ai_tip_fa": "در لحظه پایان حرکت (رو به دوربین) دست را حدود ۱ ثانیه ثابت نگه دارید تا مدل فریم را تایید کند.",
        "arrow": '<path d="M 140 100 Q 140 60 140 30" stroke="#10B981" stroke-width="4" fill="none" marker-end="url(#arrowhead-green)"/><text x="100" y="25" fill="#10B981" font-size="11" font-weight="bold">حرکت به جلو و بالا ↑</text>'
    },
    "YES": {
        "title_fa": "بله / تایید",
        "title_en": "YES",
        "category_fa": "تایید و موافقت (Affirmation)",
        "hand_type_fa": "یک دستی",
        "badge_color": "#6366F1",
        "motion_fa": "تکان دادن آرام مشت از مچ به بالا و پایین (مشابه تایید سر)",
        "handshape_fa": "فرم مشت بسته (S-fist): تمام ۴ انگشت کاملاً در کف دست خم شده و جمع شده‌اند. انگشت شست به صورت افقی روی انگشتان خمیده قرار گرفته است.",
        "palm_dir_fa": "مشت بسته مستقیم رو به وب‌کم / جلو.",
        "ai_tip_fa": "شست نباید بالا باشد (با لایک اشتباه نشود)؛ شست باید دقیقاً روی بند انگشتان تا شود.",
        "arrow": '<path d="M 210 110 Q 230 140 210 170" stroke="#6366F1" stroke-width="4" fill="none" marker-end="url(#arrowhead-indigo)"/><path d="M 220 160 Q 240 130 220 100" stroke="#6366F1" stroke-width="4" fill="none" marker-end="url(#arrowhead-indigo)"/><text x="165" y="195" fill="#6366F1" font-size="11" font-weight="bold">نوسان مچ ↕</text>'
    },
    "NO": {
        "title_fa": "خیر / نه",
        "title_en": "NO",
        "category_fa": "انکار و مخالفت (Negation)",
        "hand_type_fa": "یک دستی",
        "badge_color": "#EF4444",
        "motion_fa": "ضربه زدن و بستن دو انگشت اشاره و میانی به نوک انگشت شست",
        "handshape_fa": "فرم منقار پرنده: انگشتان حلقه و کوچک کاملاً مشت و خمیده در کف دست هستند. دو انگشت اشاره و میانی باز شده و نوک آن‌ها به نوک شست می‌چسبد.",
        "palm_dir_fa": "رو به وب‌کم یا کمی با زاویه به سمت چپ/راست.",
        "ai_tip_fa": "چسبیدن نوک انگشت اشاره و میانی به انگشت شست ویژگی کلیدی بردار هندسی این حرکت است.",
        "arrow": '<path d="M 120 70 Q 135 110 140 125" stroke="#EF4444" stroke-width="3" fill="none" marker-end="url(#arrowhead-red)"/><path d="M 160 70 Q 145 110 140 125" stroke="#EF4444" stroke-width="3" fill="none"/><text x="100" y="55" fill="#EF4444" font-size="11" font-weight="bold">بستن منقار ↘↙</text>'
    },
    "PLEASE": {
        "title_fa": "لطفاً / خواهش می‌کنم",
        "title_en": "PLEASE",
        "category_fa": "درخواست مودبانه (Courtesy)",
        "hand_type_fa": "یک دستی",
        "badge_color": "#EC4899",
        "motion_fa": "چرخش ملایم و دایره‌ای کف دست روی مرکز قفسه سینه",
        "handshape_fa": "فرم دست باز (Flat-B): کف دست کاملاً صاف، چهار انگشت به هم پیوسته و روی مرکز قفسه سینه قرار می‌گیرند و حرکتی آرام به صورت دایره‌ای روی سینه انجام می‌دهند.",
        "palm_dir_fa": "کف دست مستقیم رو به قفسه سینه (پشت دست رو به دوربین).",
        "ai_tip_fa": "دست را خیلی بالا یا خیلی پایین نبرید؛ درست در ارتفاع سینه در کادر دوربین قرار دهید.",
        "arrow": '<path d="M 110 130 A 35 35 0 1 1 170 150" stroke="#EC4899" stroke-width="4" fill="none" marker-end="url(#arrowhead-pink)"/><text x="105" y="210" fill="#EC4899" font-size="11" font-weight="bold">حرکت دایره‌ای ↻</text>'
    },
    "HELP": {
        "title_fa": "کمک / امداد",
        "title_en": "HELP",
        "category_fa": "درخواست یاری (Assistance)",
        "hand_type_fa": "یک یا دو دستی (فرم اصلی: شست بالا)",
        "badge_color": "#F59E0B",
        "motion_fa": "دست مشت شده با شست بالا روی کف دست دیگر قرار گرفته و به بالا برده می‌شود",
        "handshape_fa": "علامت لایک (Thumbs-Up / A-fist): تمام ۴ انگشت محکم مشت شده‌اند و انگشت شست به صورت عمودی و مستقیم رو به بالا اشاره می‌کند.",
        "palm_dir_fa": "شست مستقیم رو به بالا، بند انگشتان مشت شده به سمت طرفین.",
        "ai_tip_fa": "شست را کاملاً راست و کشیده رو به سقف نگه دارید تا اختلاف زاویه ۹۰ درجه با انگشتان مشت شده ثبت شود.",
        "arrow": '<path d="M 140 110 L 140 40" stroke="#F59E0B" stroke-width="4" fill="none" marker-end="url(#arrowhead-amber)"/><text x="110" y="30" fill="#F59E0B" font-size="11" font-weight="bold">شست مستقیم به بالا ↑</text>'
    },
    "STOP": {
        "title_fa": "توقف / ایست",
        "title_en": "STOP",
        "category_fa": "ایمنی و هشدار (Safety)",
        "hand_type_fa": "یک دستی (علامت ایست پلیس)",
        "badge_color": "#DC2626",
        "motion_fa": "دست صاف و عمودی در برابر دوربین قرار می‌گیرد",
        "handshape_fa": "کف دست کاملاً باز و سفت، انگشتان صاف رو به بالا و کف دست با زاویه قائمه رو به دوربین است. در فرم سنتی دو دستی، لبه این دست عمودی بر کف دست افقی دیگر ضربه می‌زند.",
        "palm_dir_fa": "مستقیم و صریح رو به وب‌کم.",
        "ai_tip_fa": "دست را صاف نگه دارید و مچ را خم نکنید؛ صفحه دست باید با لنز دوربین موازی باشد.",
        "arrow": '<line x1="70" y1="210" x2="210" y2="210" stroke="#DC2626" stroke-width="5"/><text x="105" y="235" fill="#DC2626" font-size="12" font-weight="bold">توقف قطعی ✋</text>'
    },
    "GOOD": {
        "title_fa": "خوب / عالی",
        "title_en": "GOOD",
        "category_fa": "ارزیابی مثبت (Positive)",
        "hand_type_fa": "یک یا دو دستی",
        "badge_color": "#14B8A6",
        "motion_fa": "دست از چانه به سمت جلو و پایین آمده و کف دست رو به بالا قرار می‌گیرد",
        "handshape_fa": "دست صاف با انگشتان چسبیده به هم ابتدا چانه را لمس می‌کند و سپس به سمت جلو متمایل شده، طوری که کف دست رو به بالا قرار می‌گیرد.",
        "palm_dir_fa": "کف دست متمایل به سمت بالا و جلو (رو به آسمان).",
        "ai_tip_fa": "مهم‌ترین عامل تفکیک GOOD از BAD، زاویه کف دست است که در GOOD رو به بالاست.",
        "arrow": '<path d="M 140 80 Q 150 140 180 150" stroke="#14B8A6" stroke-width="4" fill="none" marker-end="url(#arrowhead-teal)"/><text x="120" y="180" fill="#14B8A6" font-size="11" font-weight="bold">کف دست رو به بالا ↗</text>'
    },
    "BAD": {
        "title_fa": "بد / نامناسب",
        "title_en": "BAD",
        "category_fa": "ارزیابی منفی (Negative)",
        "hand_type_fa": "یک دستی",
        "badge_color": "#8B5CF6",
        "motion_fa": "دست از چانه جدا شده و کف دست به سمت پایین چرخیده و دور می‌شود",
        "handshape_fa": "دست صاف ابتدا چانه را لمس می‌کند، سپس دست می‌چرخد تا کف دست رو به پایین قرار گیرد و با یک حرکت رو به بیرون از بدن دور می‌شود.",
        "palm_dir_fa": "کف دست رو به زمین (پایین) و زاویه‌دار به سمت بیرون.",
        "ai_tip_fa": "کف دست را به سمت پایین متمایل کنید تا بردار نرمال دست جهت منفی محور Y را ثبت کند.",
        "arrow": '<path d="M 140 80 Q 130 140 100 160" stroke="#8B5CF6" stroke-width="4" fill="none" marker-end="url(#arrowhead-purple)"/><text x="60" y="185" fill="#8B5CF6" font-size="11" font-weight="bold">کف دست رو به پایین ↘</text>'
    },
    "NAME": {
        "title_fa": "نام / اسم",
        "title_en": "NAME",
        "category_fa": "هویت و معرفی (Identity)",
        "hand_type_fa": "فرم انگشتان حرف H",
        "badge_color": "#0284C7",
        "motion_fa": "دو انگشت اشاره و میانی به صورت متقاطع روی دو انگشت دست دیگر ضربه می‌زنند",
        "handshape_fa": "فرم حرف H در ASL: دو انگشت اشاره و میانی کاملاً صاف و چسبیده به هم به سمت جلو امتداد دارند. انگشت شست روی دو انگشت حلقه و کوچک قرار دارد تا آن‌ها را بسته نگه دارد.",
        "palm_dir_fa": "لبه انگشتان یا کف دست متمایل به سمت داخل/مخاطب.",
        "ai_tip_fa": "تنها دو انگشت اشاره و میانی باید باز باشند؛ بسته بودن حلقه و کوچک حیاتی است.",
        "arrow": '<path d="M 120 40 L 160 40" stroke="#0284C7" stroke-width="3"/><path d="M 140 25 L 140 55" stroke="#0284C7" stroke-width="3"/><text x="100" y="20" fill="#0284C7" font-size="11" font-weight="bold">ضربه متقاطع H ✕</text>'
    },
    "ME": {
        "title_fa": "من / خودم",
        "title_en": "ME / I",
        "category_fa": "ضمیر اول شخص (Pronoun)",
        "hand_type_fa": "یک دستی (اشاره)",
        "badge_color": "#D97706",
        "motion_fa": "اشاره مستقیم به سمت مرکز قفسه سینه خودتان",
        "handshape_fa": "دست مشت است و فقط انگشت اشاره کشیده و باز است. نوک انگشت اشاره مستقیم به سمت سینه خودتان خم شده و اشاره می‌کند.",
        "palm_dir_fa": "نوک انگشت اشاره رو به بدن و عقب (محور Z مثبت).",
        "ai_tip_fa": "دست را نزدیک سینه بگیرید تا بردار عمق انگشت نسبت به مچ دست به سمت عقب تشخیص داده شود.",
        "arrow": '<path d="M 140 60 Q 140 100 140 130" stroke="#D97706" stroke-width="4" fill="none" marker-end="url(#arrowhead-amber-dark)"/><text x="80" y="150" fill="#D97706" font-size="11" font-weight="bold">اشاره به سمت سینه ↙</text>'
    },
    "YOU": {
        "title_fa": "شما / تو",
        "title_en": "YOU",
        "category_fa": "ضمیر دوم شخص (Pronoun)",
        "hand_type_fa": "یک دستی (اشاره)",
        "badge_color": "#2563EB",
        "motion_fa": "اشاره مستقیم به سمت طرف مقابل یا لنز وب‌کم",
        "handshape_fa": "دست مشت است و فقط انگشت اشاره کاملاً باز و مستقیم به سمت وب‌کم و مخاطب نشانه رفته است (سایر انگشتان با شست مهار شده‌اند).",
        "palm_dir_fa": "نوک انگشت اشاره مستقیم رو به وب‌کم و جلو (محور Z منفی).",
        "ai_tip_fa": "انگشت اشاره را دقیقاً رو به لنز دوربین نشانه بروید تا کوتاهی پرسپکتیو و عمق منفی ثبت گردد.",
        "arrow": '<circle cx="140" cy="80" r="14" stroke="#2563EB" stroke-width="4" fill="none"/><circle cx="140" cy="80" r="5" fill="#2563EB"/><text x="80" y="55" fill="#2563EB" font-size="11" font-weight="bold">اشاره مستقیم به دوربین ⊙</text>'
    }
}

FINGER_COLORS = {
    "thumb": "#A855F7",
    "index": "#3B82F6",
    "middle": "#10B981",
    "ring": "#F59E0B",
    "pinky": "#EC4899",
    "palm": "#64748B"
}

CONNECTIONS = [
    # Palm
    (0, 1, FINGER_COLORS["thumb"]),
    (0, 5, FINGER_COLORS["index"]),
    (0, 17, FINGER_COLORS["pinky"]),
    (5, 9, FINGER_COLORS["palm"]),
    (9, 13, FINGER_COLORS["palm"]),
    (13, 17, FINGER_COLORS["palm"]),
    # Thumb
    (1, 2, FINGER_COLORS["thumb"]),
    (2, 3, FINGER_COLORS["thumb"]),
    (3, 4, FINGER_COLORS["thumb"]),
    # Index
    (5, 6, FINGER_COLORS["index"]),
    (6, 7, FINGER_COLORS["index"]),
    (7, 8, FINGER_COLORS["index"]),
    # Middle
    (9, 10, FINGER_COLORS["middle"]),
    (10, 11, FINGER_COLORS["middle"]),
    (11, 12, FINGER_COLORS["middle"]),
    # Ring
    (13, 14, FINGER_COLORS["ring"]),
    (14, 15, FINGER_COLORS["ring"]),
    (15, 16, FINGER_COLORS["ring"]),
    # Pinky
    (17, 18, FINGER_COLORS["pinky"]),
    (18, 19, FINGER_COLORS["pinky"]),
    (19, 20, FINGER_COLORS["pinky"]),
]

def generate_hand_svg(sign_name: str) -> str:
    raw_pose = CANONICAL_HAND_POSES[sign_name]
    info = SIGNS_INFO.get(sign_name, {})
    arrow_markup = info.get("arrow", "")
    badge_color = info.get("badge_color", "#3B82F6")

    # SVG Canvas: 280 x 280
    W, H = 280, 280
    cx = 0.50
    cy = 0.52
    scale = 260.0

    points_2d = []
    for pt in raw_pose:
        x, y, z = pt
        sx = round(W / 2 + (x - cx) * scale, 1)
        sy = round(H / 2 + (y - cy) * scale, 1)
        points_2d.append((sx, sy, z))

    # Hand silhouette / soft hull path behind bones
    palm_pts = [points_2d[0], points_2d[1], points_2d[2], points_2d[5], points_2d[9], points_2d[13], points_2d[17]]
    hull_path = f"M {points_2d[0][0]} {points_2d[0][1]} "
    for pt in palm_pts[1:]:
        hull_path += f"L {pt[0]} {pt[1]} "
    hull_path += "Z"

    # Draw bones
    lines_svg = []
    for start, end, col in CONNECTIONS:
        x1, y1, _ = points_2d[start]
        x2, y2, _ = points_2d[end]
        lines_svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>')

    # Draw joints (nodes)
    nodes_svg = []
    tips = {4, 8, 12, 16, 20}
    for i, (x, y, z) in enumerate(points_2d):
        if i in tips:
            # Highlight fingertip
            nodes_svg.append(f'<circle cx="{x}" cy="{y}" r="6.5" fill="#06B6D4" stroke="#FFFFFF" stroke-width="2"/>')
        elif i == 0:
            # Wrist
            nodes_svg.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{badge_color}" stroke="#FFFFFF" stroke-width="2.5"/>')
        else:
            # Internal joint
            nodes_svg.append(f'<circle cx="{x}" cy="{y}" r="4" fill="#FFFFFF" stroke="{badge_color}" stroke-width="1.5"/>')

    return f'''
    <svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" style="background: radial-gradient(circle at center, #1E1B4B 0%, #0F172A 100%); border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.35); box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
      <defs>
        <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#06B6D4" />
        </marker>
        <marker id="arrowhead-green" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#10B981" />
        </marker>
        <marker id="arrowhead-indigo" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#6366F1" />
        </marker>
        <marker id="arrowhead-red" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#EF4444" />
        </marker>
        <marker id="arrowhead-pink" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#EC4899" />
        </marker>
        <marker id="arrowhead-amber" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#F59E0B" />
        </marker>
        <marker id="arrowhead-teal" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#14B8A6" />
        </marker>
        <marker id="arrowhead-purple" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#8B5CF6" />
        </marker>
        <marker id="arrowhead-amber-dark" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <polygon points="0 0, 7 3.5, 0 7" fill="#D97706" />
        </marker>
      </defs>

      <!-- Grid HUD backdrop -->
      <line x1="20" y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />
      <line x1="140" y1="20" x2="140" y2="260" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />
      <circle cx="140" cy="140" r="110" stroke="rgba(99, 102, 241, 0.15)" stroke-width="1" fill="none"/>

      <!-- Palm soft area -->
      <path d="{hull_path}" fill="rgba(99, 102, 241, 0.18)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1.5" />

      <!-- Skeleton Bones -->
      {''.join(lines_svg)}

      <!-- Joint Nodes -->
      {''.join(nodes_svg)}

      <!-- Motion / Direction Arrow -->
      {arrow_markup}

      <!-- Badge Overlay -->
      <rect x="12" y="246" width="105" height="22" rx="6" fill="rgba(0,0,0,0.6)" stroke="{badge_color}" stroke-width="1"/>
      <text x="64" y="261" fill="#E2E8F0" font-size="10" font-weight="bold" text-anchor="middle">۲۱ لندمارک هوش مصنوعی</text>
    </svg>
    '''

def build_html() -> str:
    sign_cards_html = []
    
    signs_keys = list(SIGNS_INFO.keys())
    
    # We pair signs 2 per page for gorgeous layout:
    # Page 1: Cover & Intro
    # Page 2: HELLO & THANK_YOU
    # Page 3: YES & NO
    # Page 4: PLEASE & HELP
    # Page 5: STOP & GOOD
    # Page 6: BAD & NAME
    # Page 7: ME & YOU
    # Page 8: Summary Matrix & Quick Rules

    for i in range(0, len(signs_keys), 2):
        pair = signs_keys[i:i+2]
        page_items = []
        for sign in pair:
            info = SIGNS_INFO[sign]
            svg_code = generate_hand_svg(sign)
            
            card = f'''
            <div class="sign-card">
              <div class="sign-visual">
                {svg_code}
                <div class="visual-caption">فرم سه‌بعدی دست و ۲۱ مفصل ردیابی مدیاپایپ</div>
              </div>
              <div class="sign-details">
                <div class="sign-header">
                  <div class="sign-badge" style="background-color: {info['badge_color']};">{info['category_fa']}</div>
                  <div class="sign-titles">
                    <h2 class="title-en">{info['title_en']}</h2>
                    <h3 class="title-fa">{info['title_fa']}</h3>
                  </div>
                </div>

                <div class="info-row">
                  <span class="info-label">نحوه اجرای حرکت:</span>
                  <p class="info-text highlight">{info['motion_fa']}</p>
                </div>

                <div class="info-row">
                  <span class="info-label">فرم دقیق انگشتان (Handshape):</span>
                  <p class="info-text">{info['handshape_fa']}</p>
                </div>

                <div class="info-row">
                  <span class="info-label">جهت‌گیری کف دست (Orientation):</span>
                  <p class="info-text">{info['palm_dir_fa']}</p>
                </div>

                <div class="tip-box">
                  <span class="tip-title">💡 نکته طلایی هوش مصنوعی:</span>
                  <span class="tip-text">{info['ai_tip_fa']}</span>
                </div>
              </div>
            </div>
            '''
            page_items.append(card)

        page_block = f'''
        <div class="page signs-page">
          <div class="page-header">
            <span class="header-logo">SignBridge AI</span>
            <span class="header-subtitle">راهنمای تصویری ۱۲ واژه استاندارد زبان اشاره ASL</span>
          </div>
          <div class="cards-container">
            {page_items[0]}
            {page_items[1] if len(page_items) > 1 else ''}
          </div>
          <div class="page-footer">
            <span>سیستم تبدیل آنلاین و لبه‌ای زبان اشاره به صوت و متن</span>
            <span>صفحه اختصاصی واژگان</span>
          </div>
        </div>
        '''
        sign_cards_html.append(page_block)

    html_content = f'''<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>SignBridge AI - راهنمای تصویری حرکات زبان اشاره</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap');

    @page {{
      size: A4 portrait;
      margin: 0;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #0B0F19;
      color: #E2E8F0;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}

    .page {{
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      position: relative;
      padding: 16mm 16mm 14mm 16mm;
      display: flex;
      flex-direction: column;
      background: #0B0F19;
      overflow: hidden;
    }}

    /* Cover Page */
    .cover-page {{
      background: radial-gradient(circle at top right, #1E1B4B 0%, #0B0F19 60%, #05070E 100%);
      justify-content: space-between;
      color: #FFFFFF;
    }}

    .cover-hero {{
      text-align: center;
      margin-top: 10px;
    }}

    .logo-badge {{
      display: inline-block;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.5);
      color: #A5B4FC;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 14px;
    }}

    .cover-title {{
      font-size: 32px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 50%, #818CF8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }}

    .cover-subtitle {{
      font-size: 16px;
      color: #94A3B8;
      max-width: 600px;
      margin: 0 auto 16px auto;
    }}

    .cover-banner-img {{
      width: 100%;
      height: 240px;
      object-fit: cover;
      border-radius: 18px;
      border: 1px solid rgba(99, 102, 241, 0.4);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
      margin-bottom: 20px;
    }}

    .cover-features {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 18px;
    }}

    .feat-card {{
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }}

    .feat-card h4 {{
      color: #38BDF8;
      font-size: 14px;
      margin-bottom: 4px;
    }}

    .feat-card p {{
      color: #94A3B8;
      font-size: 11px;
      line-height: 1.4;
    }}

    .guide-rules {{
      background: rgba(30, 27, 75, 0.4);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 12px;
    }}

    .guide-rules h3 {{
      color: #FCD34D;
      font-size: 14px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .guide-rules ul {{
      margin-right: 18px;
      color: #CBD5E1;
    }}

    .guide-rules li {{
      margin-bottom: 4px;
    }}

    /* Inner Signs Pages */
    .page-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 14px;
    }}

    .header-logo {{
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 15px;
      background: linear-gradient(135deg, #38BDF8, #818CF8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .header-subtitle {{
      font-size: 12px;
      color: #64748B;
    }}

    .cards-container {{
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }}

    .sign-card {{
      display: flex;
      flex-direction: row;
      gap: 18px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      height: 48%;
      align-items: center;
    }}

    .sign-visual {{
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 250px;
      flex-shrink: 0;
    }}

    .visual-caption {{
      font-size: 10px;
      color: #64748B;
      margin-top: 6px;
      text-align: center;
    }}

    .sign-details {{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      height: 100%;
    }}

    .sign-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }}

    .sign-badge {{
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }}

    .sign-titles {{
      text-align: left;
      direction: ltr;
    }}

    .title-en {{
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.1;
    }}

    .title-fa {{
      font-size: 13px;
      color: #94A3B8;
      font-weight: 600;
      direction: rtl;
    }}

    .info-row {{
      margin-bottom: 6px;
      font-size: 12px;
    }}

    .info-label {{
      color: #38BDF8;
      font-weight: 700;
      display: block;
      margin-bottom: 1px;
      font-size: 11.5px;
    }}

    .info-text {{
      color: #E2E8F0;
      font-size: 11.5px;
      line-height: 1.45;
    }}

    .info-text.highlight {{
      color: #F8FAFC;
      font-weight: 600;
    }}

    .tip-box {{
      background: rgba(245, 158, 11, 0.12);
      border-right: 3px solid #F59E0B;
      padding: 6px 10px;
      border-radius: 0 8px 8px 0;
      margin-top: 4px;
      font-size: 11px;
    }}

    .tip-title {{
      color: #FCD34D;
      font-weight: 700;
      display: inline;
    }}

    .tip-text {{
      color: #FEF3C7;
      display: inline;
    }}

    .page-footer {{
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #475569;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 8px;
      margin-top: auto;
    }}

    /* Cheat Sheet Summary Page */
    .summary-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 10px;
      flex: 1;
      margin-top: 8px;
    }}

    .summary-card {{
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }}

    .summary-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .summary-en {{
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 14px;
      color: #38BDF8;
    }}

    .summary-fa {{
      font-size: 12px;
      font-weight: 700;
      color: #FFFFFF;
    }}

    .summary-desc {{
      font-size: 10px;
      color: #94A3B8;
      line-height: 1.35;
      margin-top: 4px;
    }}
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="page cover-page">
    <div class="cover-hero">
      <div class="logo-badge">SIGNBRIDGE AI — ACCESSIBILITY PLATFORM</div>
      <h1 class="cover-title">راهنمای تصویری حرکات زبان اشاره (ASL)</h1>
      <p class="cover-subtitle">راهنمای جامع نحوه اجرای صحیح ۱۲ علامت اصلی برای تشخیص بلادرنگ توسط هوش مصنوعی</p>
    </div>

    <img src="assets/banner.jpg" alt="SignBridge AI Guide Banner" class="cover-banner-img" />

    <div class="cover-features">
      <div class="feat-card">
        <h4>⚡ تشخیص محلی (Edge AI)</h4>
        <p>پردازش ۲۱ مفصل سه‌بعدی دست در کمتر از ۰.۱ میلی‌ثانیه بدون ارسال تصویر به اینترنت</p>
      </div>
      <div class="feat-card">
        <h4>🛡️ پایداری زمانی (Hysteresis)</h4>
        <p>فیلتر لرزش فریم‌ها با استیت‌ماشین ۴ مرحله‌ای جهت جلوگیری از تکرار اشتباه کلمات</p>
      </div>
      <div class="feat-card">
        <h4>🔊 گفتار صوتی هوشمند (TTS)</h4>
        <p>تبدیل فوری جملات ساخته‌شده به صدای واضح انسانی با استانداردهای کامل دسترسی‌پذیری</p>
      </div>
    </div>

    <div class="guide-rules">
      <h3>📌 ۴ قانون طلایی برای دقت ۹۹٪ در هنگام استفاده از وب‌کم:</h3>
      <ul>
        <li><strong>فاصله مناسب از دوربین:</strong> دست خود را در فاصله ۵۰ تا ۸۰ سانتی‌متری از لنز وب‌کم با نوردهی مناسب بگیرید.</li>
        <li><strong>مکث ۱ ثانیه‌ای (Debounce):</strong> پس از شکل‌دهی انگشتان، دست را حدود ۰.۵ تا ۱ ثانیه ثابت نگه دارید تا هوش مصنوعی آن را در جمله تایید (Commit) کند.</li>
        <li><strong>وضوح ۲۱ مفصل:</strong> دقت کنید که تمام بندهای انگشتان در کادر تصویر دوربین قابل مشاهده باشند و پشت اشیاء یا لباس پنهان نشوند.</li>
        <li><strong>تفکیک جهت کف دست:</strong> در کلماتی مانند GOOD و BAD، جهت چرخش کف دست (رو به بالا یا رو به پایین) تنها عامل تمایز است.</li>
      </ul>
    </div>

    <div class="page-footer">
      <span>SignBridge AI — Version 1.0.0 MVP</span>
      <span>مستند آموزشی و مرجع کاربری</span>
    </div>
  </div>

  <!-- Sign Pages (6 pages, 2 signs each) -->
  {''.join(sign_cards_html)}

  <!-- Summary Matrix Page -->
  <div class="page">
    <div class="page-header">
      <span class="header-logo">SignBridge AI</span>
      <span class="header-subtitle">جدول خلاصه سریع ۱۲ واژه در یک نگاه (Quick Cheat Sheet)</span>
    </div>

    <div style="margin-bottom: 8px;">
      <h2 style="font-size: 16px; color: #FFFFFF; font-weight: 800;">مرجع سریع و فشرده تمام علائم</h2>
      <p style="font-size: 11px; color: #94A3B8;">این جدول را می‌توانید همیشه در کنار مانیتور هنگام استفاده از وب‌کم مرور کنید.</p>
    </div>

    <div class="summary-grid">
      <div class="summary-card" style="border-right: 3px solid #3B82F6;">
        <div class="summary-top"><span class="summary-en">HELLO</span><span class="summary-fa">سلام</span></div>
        <div class="summary-desc">دست کاملاً باز، ۴ انگشت چسبیده و کشیده، شست آزاد در کنار. حرکت باز شدن به سمت بیرون.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #10B981;">
        <div class="summary-top"><span class="summary-en">THANK_YOU</span><span class="summary-fa">متشکرم</span></div>
        <div class="summary-desc">کف دست صاف از نزدیک چانه به سمت جلو و بالا متمایل می‌شود.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #6366F1;">
        <div class="summary-top"><span class="summary-en">YES</span><span class="summary-fa">بله</span></div>
        <div class="summary-desc">مشت کامل با شست تا شده روی انگشتان (S-fist) با تکان ملایم بالا/پایین مچ.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #EF4444;">
        <div class="summary-top"><span class="summary-en">NO</span><span class="summary-fa">خیر</span></div>
        <div class="summary-desc">نوک دو انگشت اشاره و میانی به نوک انگشت شست متصل می‌شود (منقار پرنده).</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #EC4899;">
        <div class="summary-top"><span class="summary-en">PLEASE</span><span class="summary-fa">لطفاً</span></div>
        <div class="summary-desc">کف دست باز و صاف روی سینه قرار گرفته و دورانی حرکت داده می‌شود.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #F59E0B;">
        <div class="summary-top"><span class="summary-en">HELP</span><span class="summary-fa">کمک</span></div>
        <div class="summary-desc">علامت لایک (شست مستقیم رو به بالا) و سایر انگشتان مشت شده.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #DC2626;">
        <div class="summary-top"><span class="summary-en">STOP</span><span class="summary-fa">ایست</span></div>
        <div class="summary-desc">کف دست کاملاً باز و عمودی رو به لنز وب‌کم با انگشتان کشیده رو به بالا.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #14B8A6;">
        <div class="summary-top"><span class="summary-en">GOOD</span><span class="summary-fa">خوب</span></div>
        <div class="summary-desc">دست صاف از چانه پایین می‌آید طوری که کف دست رو به بالا و آسمان قرار گیرد.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #8B5CF6;">
        <div class="summary-top"><span class="summary-en">BAD</span><span class="summary-fa">بد</span></div>
        <div class="summary-desc">دست صاف از چانه دور می‌شود طوری که کف دست رو به پایین و زمین قرار گیرد.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #0284C7;">
        <div class="summary-top"><span class="summary-en">NAME</span><span class="summary-fa">نام</span></div>
        <div class="summary-desc">دو انگشت اشاره و میانی چسبیده و باز (فرم H)، شست روی دو انگشت دیگر بسته.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #D97706;">
        <div class="summary-top"><span class="summary-en">ME</span><span class="summary-fa">من</span></div>
        <div class="summary-desc">دست مشت و تنها انگشت اشاره باز است و مستقیم به سمت سینه خودتان اشاره می‌کند.</div>
      </div>
      <div class="summary-card" style="border-right: 3px solid #2563EB;">
        <div class="summary-top"><span class="summary-en">YOU</span><span class="summary-fa">شما</span></div>
        <div class="summary-desc">دست مشت و تنها انگشت اشاره باز است و مستقیم به سمت دوربین نشانه رفته است.</div>
      </div>
    </div>

    <div style="background: rgba(30, 27, 75, 0.4); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 12px; margin-top: 10px; font-size: 11px;">
      <h4 style="color: #38BDF8; font-size: 13px; margin-bottom: 4px;">🎯 نحوه آزمایش عملی در وب‌اپلیکیشن:</h4>
      <p style="color: #CBD5E1;">با اجرای دستور <code>npm run dev</code> در پوشه <code>frontend</code>، داشبورد وب باز می‌شود. وب‌کم را روشن کنید و هر یک از این فرم‌ها را روبروی دوربین بگیرید. نوار اطمینان سبز رنگ فعال شده و کلمه به بافر متن اضافه می‌گردد.</p>
    </div>

    <div class="page-footer">
      <span>SignBridge AI — راهنمای جامع تصویری</span>
      <span>صفحه پایانی</span>
    </div>
  </div>

</body>
</html>
'''
    return html_content

def main():
    print("Generating HTML content with vector landmarks...")
    html = build_html()

    html_path = os.path.abspath("docs/asl_guide.html")
    pdf_path = os.path.abspath("docs/SignBridge_AI_ASL_Guide.pdf")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML written to {html_path}")

    # Generate PDF using Chrome Headless
    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_exe):
        chrome_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    print(f"Exporting PDF using: {chrome_exe}")
    cmd = [
        chrome_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        f"file:///{html_path.replace(os.sep, '/')}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"SUCCESS: PDF generated at {pdf_path} ({size_kb:.1f} KB)")
    else:
        print(f"Error generating PDF. Stderr: {result.stderr}")

if __name__ == "__main__":
    main()
