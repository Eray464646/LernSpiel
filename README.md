# Quiz Roguelite - Big Data & Data Science Lernspiel

Ein interaktives Quiz-Roguelite-Spiel zum Lernen von Big Data und Data Science Konzepten.

## 🎮 Spielprinzip

- **Top-Down Roguelite**: Steuere deine Spielfigur durch verschiedene Räume
- **Quiz-basiert**: Jeder Raum enthält eine Frage aus den Kursmaterialien
- **Richtige Antworten**: Belohnungen wie +HP, +Score, +Shield
- **Falsche Antworten**: -1 HP + Erklärung mit Quellenangabe
- **Boss-Räume**: Jeder 10. Raum ist ein Boss-Raum mit schwierigeren Fragen

## 📊 Fragen-Datenbank

Das Spiel enthält **4430 Fragen** aus 20 verschiedenen Quelldateien:
- Alle Fragen sind direkt aus den PDF-Unterlagen extrahiert
- Jede Frage hat Metadaten: Quelle, Seitenzahl, Schwierigkeit, Tags
- Verschiedene Fragetypen: Single-Choice, Multiple-Choice, Wahr/Falsch

Siehe [coverage.md](coverage.md) für Details zur Fragenabdeckung.

## 🎯 Spielmodi

1. **Normal**: Standard-Modus mit 20 Räumen
2. **Zeitdruck**: Zeitlimit für jede Frage
3. **Boss Rush**: Nur Boss-Fragen (schwieriger)
4. **Transferaufgabe**: Fokus auf CRISP-DM und praktische Anwendung

## 🕹️ Steuerung

- **Bewegung**: Pfeiltasten oder WASD
- **Frage beantworten**: Klicke auf eine Antwortoption und dann auf "Antwort prüfen"
- **Weiter**: Nach der Erklärung auf "Weiter" klicken

## 📁 Projektstruktur

```
LernSpiel/
├── index.html              # Hauptspiel-HTML
├── src/
│   └── game.js            # Game Engine
├── data/
│   └── questions/         # JSON-Fragendateien (20 Dateien)
├── sources/               # Ursprüngliche PDF-Dateien
├── assets/                # Sprites und Assets
├── coverage.md            # Fragenabdeckungs-Report
└── extract_questions.py   # PDF-Extraktions-Script
```

## 🚀 Installation & Start

### Lokal testen
1. Repository klonen
2. Einen lokalen Webserver starten:
   ```bash
   python3 -m http.server 8000
   ```
3. Browser öffnen: `http://localhost:8000`

### GitHub Pages
Das Spiel ist direkt über GitHub Pages verfügbar (statische Seite, kein Backend erforderlich).

## 🔧 Fragen generieren

Um neue Fragen aus PDFs zu generieren:

```bash
python3 extract_questions.py
```

Dies verarbeitet alle PDFs im `sources/` Ordner und generiert:
- JSON-Dateien in `data/questions/`
- Aktualisierte `coverage.md`

## 📚 Quellen

Alle Fragen basieren ausschließlich auf den bereitgestellten Kursmaterialien:
- Big Data & Data Science Begriffe, Exploration, Preparation
- Machine Learning Verfahren (kNN, Naive Bayes, etc.)
- Neural Networks & Deep Learning
- KI-Technologien & LLMs
- Big Data Analytics & Tools
- Transferaufgaben & Lösungen

Jede Frage zeigt ihre Quelle (Dateiname + Seitenzahl) in der Erklärung an.

## 🎓 Lernfeatures

- **Fehler-Tracking**: Falsch beantwortete Fragen werden gespeichert
- **Quellenangaben**: Jede Erklärung zeigt die genaue Quelle
- **Themenfilter**: Lerne gezielt einzelne Themen
- **Progressives Lernen**: Schwierigkeitsgrade von 1-5

## 🛡️ Game Mechanics

- **HP**: 10 Lebenspunkte (Start)
- **Shield**: Absorbiert 1 Schaden
- **Score**: Punkte für richtige Antworten
- **Räume**: 20 Räume pro Run
- **Boss-Räume**: Jeden 10. Raum (härtere Fragen)

## 📝 Lizenz

Bildungsprojekt - Alle Inhalte basieren auf Kursmaterialien.