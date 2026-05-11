from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
import markdown
import re

input_path = r"C:\Users\Lenovo\Downloads\HiteshTaneja_Nokia_CoverLetter.md"
output_path = r"C:\Users\Lenovo\Downloads\HiteshTaneja_Nokia_CoverLetter.pdf"

with open(input_path, 'r', encoding='utf-8') as f:
    text = f.read()

html = markdown.markdown(text)
# Convert headings to bold text and preserve spacing
html = re.sub(r'<h[1-6]>(.*?)</h[1-6]>', r'<b>\1</b><br/><br/>', html, flags=re.S)
# Convert lists to simple bullets
html = html.replace('<ul>', '').replace('</ul>', '')
html = html.replace('<ol>', '').replace('</ol>', '')
html = re.sub(r'<li>(.*?)</li>', r'• \1<br/>', html, flags=re.S)
# Use paragraph breaks for paragraphs
html = html.replace('</p>', '<br/><br/>').replace('<p>', '')
# Replace line breaks
html = html.replace('\n', ' ')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Body', fontName='Helvetica', fontSize=10, leading=14, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='Heading', parent=styles['Body'], fontSize=12, leading=16, spaceAfter=10))

story = []
for block in html.split('<br/><br/>'):
    content = block.strip()
    if not content:
        continue
    story.append(Paragraph(content, styles['Body']))
    story.append(Spacer(1, 6))

if not story:
    story.append(Paragraph('No content found.', styles['Body']))

pdf = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
pdf.build(story)
print(f'Created PDF: {output_path}')
