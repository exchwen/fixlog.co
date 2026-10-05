import os

file_path = r"c:\Users\90545\Desktop\PROJELERİM\fixlog-cod\fixlog.co\app\masterboss\dashboard\page.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix unescaped entities
content = content.replace("Ekrana Ekle'yi", "Ekrana Ekle&apos;yi")
content = content.replace("Paywall'a Düşür", "Paywall&apos;a Düşür")
content = content.replace('"Karlılık & Maliyet"', '&quot;Karlılık &amp; Maliyet&quot;')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed unescaped entities.")
