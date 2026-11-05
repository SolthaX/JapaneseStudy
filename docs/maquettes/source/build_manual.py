"""Builds the Benkyō user manual: EB Garamond 12 pt, black, single spacing."""

import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
from reportlab.platypus import SimpleDocTemplate, Paragraph, ListFlowable, ListItem, CondPageBreak, Image, Table, TableStyle, KeepTogether
from PIL import Image as PILImage

FONTS, OUT, SHOTS = sys.argv[1], sys.argv[2], sys.argv[3]
for name in ['Regular', 'Italic', 'Bold', 'BoldItalic']:
    pdfmetrics.registerFont(TTFont(f'Garamond-{name}', f'{FONTS}/EBGaramond-{name}.ttf'))
pdfmetrics.registerFont(TTFont('JP', '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'))
addMapping('Garamond', 0, 0, 'Garamond-Regular')
addMapping('Garamond', 0, 1, 'Garamond-Italic')
addMapping('Garamond', 1, 0, 'Garamond-Bold')
addMapping('Garamond', 1, 1, 'Garamond-BoldItalic')

SIZE, LEAD = 12, 14  # 12 pt type, single line spacing
body = ParagraphStyle('body', fontName='Garamond-Regular', fontSize=SIZE, leading=LEAD, textColor=black, alignment=TA_JUSTIFY, spaceAfter=3)
h1 = ParagraphStyle('h1', parent=body, fontName='Garamond-Bold', alignment=0, spaceBefore=8, spaceAfter=2, keepWithNext=True)
title = ParagraphStyle('title', parent=body, fontName='Garamond-Bold', alignment=TA_CENTER, spaceAfter=0)
sub = ParagraphStyle('sub', parent=body, fontName='Garamond-Italic', alignment=TA_CENTER, spaceAfter=8)
item = ParagraphStyle('item', parent=body, spaceAfter=1)
caption = ParagraphStyle('caption', parent=body, fontName='Garamond-Italic', alignment=TA_CENTER, spaceBefore=2, spaceAfter=8)


def jp(text):
    return f'<font name="JP" size="{SIZE - 1}">{text}</font>'


story = []
P = lambda t, s=body: story.append(Paragraph(t, s))
H = lambda t: story.extend([CondPageBreak(3 * LEAD), Paragraph(t, h1)])  # never strand a heading at a page foot


def fig(images, text):
    """Screenshots side by side (name, width in cm) with a caption underneath."""
    cells = []
    for name, w in images:
        path = f'{SHOTS}/{name}.png'
        iw, ih = PILImage.open(path).size
        cells.append(Image(path, width=w * cm, height=w * cm * ih / iw))
    table = Table([cells], hAlign='CENTER')
    table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6)]))
    story.append(KeepTogether([table, Paragraph(text, caption)]))


def bullets(items, numbered=False):
    flow = [ListItem(Paragraph(t, item), leftIndent=16) for t in items]
    if numbered:
        story.append(ListFlowable(flow, bulletType='1', bulletFormat='%s.', bulletFontName='Garamond-Regular',
                                  bulletFontSize=SIZE, leftIndent=16, spaceAfter=3))
    else:
        story.append(ListFlowable(flow, bulletType='bullet', start='•', bulletFontName='Garamond-Regular',
                                  bulletFontSize=SIZE, leftIndent=16, spaceAfter=3))


P('BENKYŌ — USER MANUAL', title)
P('Your Japanese study dashboard for iPhone and computer', sub)

H('1. What Benkyō is')
P('Benkyō gathers everything you use to study Japanese in one place: WaniKani (kanji and vocabulary), Bunpro '
  '(grammar reviews), the Genki I and II textbooks and the Quartet books that follow them (with the ToKini Andy '
  'videos), the Japan Foundation Sydney conjugation drill, the books you read (Natively, WaniKani book clubs) and '
  'NHK news. It shows what is left to do today, keeps a calendar of what you did, and tracks your pace towards the '
  'dates you set. It is a website that installs like an app on your phone and on your computer. It is free and has '
  'no account of its own: your progress stays on your devices.')

H('2. Getting started')
P('<b>On iPhone.</b> Open the site address in <b>Safari</b>, tap <i>Share</i>, then <i>Add to Home Screen</i>. Always '
  'open Benkyō from that icon: the home screen app and Safari keep separate data.')
P('<b>On a computer.</b> Open the site in Chrome or Edge and click <b>Install app</b> at the top of the page (or the '
  'install icon in the address bar). Benkyō opens in its own window. Right-click its taskbar icon and choose '
  '<i>Pin to taskbar</i> (on a Mac: right-click in the Dock, <i>Options</i>, <i>Keep in Dock</i>). On a wide screen the '
  'app shows a sidebar and a two-column dashboard.')
P('<b>With Zen or Firefox.</b> These browsers cannot install web apps. Keep Benkyō as a pinned tab instead: right-click '
  'its tab and choose <i>Pin Tab</i>, or drag it into Zen’s <i>Essentials</i>, so it stays open at the top of the sidebar. '
  'Everything else works the same, links included. If you also want a separate window in the taskbar, install it once '
  'from Chrome or Edge as above; both share the same data through sync (section 11).')
P('<b>First setup</b> (gear icon at the top right):')
bullets([
    '<b>Your name</b>, used in the greeting.',
    '<b>WaniKani token</b>: on wanikani.com go to <i>Settings, API Tokens</i>, create a token with the default '
    'read-only permissions and paste it. Benkyō then shows your level, lessons, reviews and forecast, and ticks your '
    'WaniKani goal by itself when you have done reviews.',
    '<b>Daily goals</b>: switch on the activities you want to do every day.',
    '<b>Sync</b> and <b>widget</b>: see sections 11 and 12.',
])

H('3. Today')
P('The home tab. The <b>sakura tree</b> gains one blossom for each day you studied in the last 30 days; at 30 it is '
  'in full bloom. The big number is your <b>streak</b>: consecutive days with at least one activity (today only '
  'counts once you have done something, so the streak is not lost before the day ends).')
P('<b>Daily goals</b> lists today’s activities. Tap the circle to mark one done, and <i>Open</i> to go to the site or '
  'tab concerned. Below are the <b>WaniKani</b> card (level, lessons, reviews, 24-hour forecast, items per SRS stage; '
  'tap <i>Sync</i> to refresh), the <b>Bunpro</b> card (Bunpro has no public API, so you tick it once your reviews are '
  'done), your current <b>textbook</b> with its pace, and the <b>proverb of the day</b>.')
fig([('m-today', 3.3), ('d-today', 8.6)], 'Figure 1. The Today tab on iPhone (left) and the dashboard layout on a computer (right).')

H('4. My links')
P('The <b>My links</b> card on the Today tab gathers the sites you use, as icon tiles that open in a new tab. It comes '
  'with WaniKani, Bunpro, NHK Easy, NHK News, the four ToKini Andy playlists (Genki I and II, Quartet 1 and 2), the '
  'conjugation drill, Natively and the WaniKani book clubs. Tap <b>Edit</b> to rename, reorder (arrows), delete or add '
  'links. For the icon, type an emoji, or leave the box empty to use the website’s own icon. <i>Restore default links</i> '
  'brings back the original list. Your links are synced between devices.')
fig([('m-links', 4.6)], 'Figure 2. The My links card.')

H('5. Calendar and achievements')
P('The month view colours each day by how many activities you did, with one coloured dot per activity. Tap any day '
  'to tick or untick activities after the fact and to write a note. The strip below shows the last six months. '
  '<b>Achievements</b> unlock automatically: streaks, study days, WaniKani levels, finished books, conjugation '
  'sessions, news reading.')
fig([('m-calendar', 4.2)], 'Figure 3. The calendar: the darker the day, the more you studied; dots show which activities.')

H('6. Books: Genki and Quartet')
P('Choose a book at the top. Each chapter opens to show its steps (vocabulary, ToKini Andy video, grammar, dialogue, '
  'workbook, kanji, reading and writing; for Quartet: reading, writing, speaking, listening). Tap a step to mark it '
  'done. Genki chapters also list each grammar point; ticking them all completes the grammar step. The '
  '<i>ToKini Andy</i> button opens the matching videos on YouTube. A chapter is finished when all its steps are done.')
P('<b>Target date.</b> Enter the date by which you want to finish the book. Benkyō computes how many chapters per week '
  'you need and whether you are <i>ahead</i>, <i>on track</i> or <i>behind</i>, measured from the day you set the '
  'date. If you already finished a book before using Benkyō, use <b>Mark whole book done</b> so the app moves on to '
  'the next one.')
fig([('m-book', 4.6), ('m-chapter', 4.6)], 'Figure 4. A book with its pace (left) and an open chapter with its steps and grammar points (right).')

H('7. Reading')
P('Add the books you read (title, number of pages, optional Natively or book club link). For the book in progress, '
  'use the minus and plus buttons or type the page you reached: pages read count towards today’s reading goal. Change the '
  'status to <i>Up next</i> or <i>Finished</i> when needed. Links to Natively and the WaniKani book clubs are at the bottom.')

H('8. News')
P('Two lists refreshed every three hours. <b>Easy</b>: NHK News Web Easy stories in simplified Japanese, opened on NHK '
  'Easier, which shows them with furigana and a dictionary (NHK’s own Easy site now requires an NHK ONE login to be read '
  'automatically). <b>Regular</b>: NHK News headlines. Opening a headline ticks <i>Read the news</i> for today. Links to the '
  'official NHK sites are at the bottom.')

H(f'9. Only the kanji you know')
P(f'Japanese in the app uses only the kanji you have brought to <b>Guru</b> on WaniKani. A word containing a kanji you '
  f'have not learned yet appears in English, word by word: you may see “{jp("今日の")} goals” before “{jp("今日の目標")}”. '
  f'The app therefore becomes more Japanese as you level up. Words in Japanese with a dotted underline can be '
  f'<b>tapped (or clicked) to show their reading</b> (furigana). News headlines and your own book titles are shown as '
  f'they are. Without a WaniKani token the interface stays in English.')

H('10. Export to Obsidian')
P('To feed your notes or second brain, open the settings and choose <b>Export notes for Obsidian (.zip)</b>. The zip '
  'contains a <b>Benkyō</b> folder: a dashboard (today, WaniKani, books, reading, last 14 days, achievements), one note '
  'per book with every chapter step and grammar point as checkboxes, your reading list, one study log per month with '
  'your daily notes, the list of kanji you have learned, and your links. Unzip it into your vault and replace the '
  'previous Benkyō folder each time; keep your own notes outside that folder, since an export overwrites it. Each note '
  'starts with properties (frontmatter) that Dataview queries and Claude can read.')

H('11. Sync between phone and computer')
P('Each device keeps its own copy of your progress. To have the same data everywhere, Benkyō saves it in a private '
  '(“secret”) gist on your GitHub account. Set it up once:')
bullets([
    'On github.com, open <i>Settings, Developer settings, Personal access tokens, Tokens (classic)</i>, choose '
    '<i>Generate new token (classic)</i>, tick only <b>gist</b>, choose <i>No expiration</i>, and copy the token. '
    'The link in Benkyō’s settings opens this page pre-filled.',
    'Paste the token in the settings, section <i>Sync phone and computer</i>, on <b>each</b> device.',
    'The first device creates the gist; the others find it. The cloud badge at the top shows that sync works.',
], numbered=True)
P('Sync runs when you open the app and a few seconds after each change. If you edit the same day on two devices, '
  'the most recent edit wins. Only progress is uploaded, never your WaniKani or GitHub token. A secret gist is not '
  'listed publicly, but anyone who has its exact link can read it.')
fig([('m-settings', 4.0)], 'Figure 5. The sync section of the settings.')

H('12. Home screen widget (iPhone)')
P('The widget runs in the free <b>Scriptable</b> app. Three sizes are available and can be combined:')
bullets([
    '<b>Large</b>: streak, WaniKani level, lessons and reviews, 24-hour forecast, daily goals, textbook and pace, '
    'current book, 30-day bloom strip and proverb.',
    '<b>Medium</b> (ribbon): next grammar point to study with your pace, and the latest NHK Easy headline.',
    '<b>Small</b>: reviews waiting, level and streak.',
])
P('<b>Setup.</b> Install Scriptable. In Benkyō, open the settings (gear icon) and tap <i>Copy widget script</i>. In Scriptable tap +, paste, and name '
  'the script exactly <b>Benkyo Widget</b>. Back in Benkyō tap <i>Update widget</i> (Scriptable opens and saves your '
  'data). On the home screen, press and hold an empty area, tap <i>Edit</i>, <i>Add Widget</i>, choose Scriptable and a '
  'size. Then press and hold the widget, <i>Edit Widget</i>, and choose the script <i>Benkyo Widget</i>.')
P('WaniKani figures refresh on their own (iOS decides when, usually every 15 to 30 minutes). Goals, streak and book '
  'progress are sent when you tap <b>Update</b> on the Today tab: do it after ticking your activities. To install a '
  'new version of the widget, copy the script again and replace the text in Scriptable.')
fig([('w-large', 4.6), ('w-medium', 6.2)], 'Figure 6. The large widget (left) and the medium ribbon (right).')

H('13. Backup and privacy')
P('Everything is stored in your browser. Use <i>Export JSON</i> in the settings from time to time to keep a backup file, and '
  '<i>Import JSON</i> to restore it. <i>Erase all</i> deletes the data on that device only. Your tokens are stored only on your devices; the WaniKani token is used '
  'only to read your WaniKani data.')

H('14. Troubleshooting')
bullets([
    '<b>WaniKani shows an error</b>: check the token in the settings and tap <i>Test connection</i>.',
    '<b>Phone and computer differ</b>: make sure the same GitHub token is set on both, then tap <i>Sync now</i>. '
    'An error message under the button explains what is wrong (for example, a token without the gist permission).',
    '<b>The app does not show the latest version</b>: close it completely and reopen it; updates are applied on the '
    'next launch.',
    '<b>The widget shows old goals</b>: tap <i>Update</i> in Benkyō. If it says “Select script”, edit the widget and '
    'choose <i>Benkyo Widget</i>.',
    '<b>No news</b>: headlines appear once the site is online and the news job (every three hours) has run at least once.',
])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Garamond-Regular', SIZE)
    canvas.setFillColor(black)
    canvas.drawCentredString(A4[0] / 2, 1.2 * cm, str(doc.page))
    canvas.restoreState()


doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=2 * cm,
                        title='Benkyō — User Manual', author='Benkyō', subject='User manual')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('ok')
