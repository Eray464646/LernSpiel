# Sources Directory

This directory contains the PDF source materials for question generation.

## Expected Files

The following PDF files should be placed in this directory:

1. 01-bigdata_data_science-begriffe_v5.pdf
2. 03_bigdata_data_science_beispieldaten v1.pdf
3. 04-bigdata_data_science-data-exploration.pdf
4. 05-bigdata_data_science-data-preparation.pdf
5. 06-bigdata_data_science_Training_Evaluierung.pdf (missing - not in repo)
6. 07-bigdata_data_science_Machine-Learning_Verfahren_A_v7.pdf
7. 08-bigdata_data_science_ML_bayes_v7_Lösung.pdf
8. 09-bigdata_data_science_NeuralNets_v7.pdf
9. 10-KI_Verschiedene_Technologien.pdf
10. 10-KI_Verschiedene_Technologien_v1.pdf
11. 11-KI_LLM_v1.pdf
12. 12-bigdata_science_Big-Data-Analytics_v3.pdf
13. 12_Neurosymbolische KI- Das Beste aus allen Welten.pdf
14. Emergenz_Grammatik_in_LLMs.pdf
15. bitkom 2018 - Digitalisierung gestalten mit dem Periodensystem.pdf
16. KI_Periodensystem_Kapitel_4_Alle_Elemente.pdf
17. Transferaufgabe.pdf
18. DE Transfer Aufgabe Big Data and Data Science.pdf
19. DataScience_Lösungen.pdf
20. AlleErhaltenZusammenfassung BigDataAndDataScience.pdf (missing - not in repo)
21. Projekt_Donut.pdf
22. Albanien_ KI-Ministerin soll Korruption ausmerzen - news.ORF.at.pdf

## Note

PDFs are excluded from git tracking (see .gitignore) due to their large file sizes.
The question JSON files in `data/questions/` were generated from these PDFs.

## Regenerating Questions

To regenerate questions from PDFs:

```bash
python3 extract_questions.py
```

This will process all PDFs in this directory and update the question files in `data/questions/`.
