#!/usr/bin/env python3
"""
PDF Question Extraction Script
Extracts content from PDFs and generates quiz questions based on the material.
"""

import json
import os
import re
from pathlib import Path
import PyPDF2

class QuestionGenerator:
    def __init__(self, sources_dir="sources", output_dir="data/questions"):
        self.sources_dir = Path(sources_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.question_id = 1
        self.coverage = {}
        
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF with page numbers."""
        pages_text = []
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    pages_text.append({
                        'page': page_num + 1,
                        'text': text
                    })
            return pages_text
        except Exception as e:
            print(f"Error extracting {pdf_path}: {e}")
            return []
    
    def clean_text(self, text):
        """Clean and normalize text."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove page numbers and headers/footers patterns
        text = re.sub(r'\b\d+\s*/\s*\d+\b', '', text)
        return text.strip()
    
    def find_definitions(self, text, page_num):
        """Find definition-style content for questions."""
        questions = []
        
        # Pattern: "Begriff: Erklärung" or "Begriff = Erklärung"
        patterns = [
            r'([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)\s*[:\-=]\s*([^.!?]+[.!?])',
            r'([A-ZÄÖÜ][a-zäöüß\-]+)\s+(?:ist|sind|bezeichnet|bedeutet)\s+([^.!?]+[.!?])',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                term = match.group(1).strip()
                definition = match.group(2).strip()
                
                if len(term) > 3 and len(definition) > 20:
                    questions.append({
                        'term': term,
                        'definition': definition,
                        'page': page_num
                    })
        
        return questions
    
    def find_lists(self, text, page_num):
        """Find bullet points or numbered lists."""
        lists = []
        
        # Find numbered lists (1., 2., etc.)
        pattern = r'(?:\d+\.|[•\-])\s*([^\n]+)'
        matches = re.findall(pattern, text)
        
        if len(matches) >= 3:
            lists.append({
                'items': matches,
                'page': page_num
            })
        
        return lists
    
    def generate_questions_from_definitions(self, definitions, source_file):
        """Generate questions from definitions."""
        questions = []
        
        for defn in definitions:
            # Single-choice question
            q = {
                'id': f"q_{self.question_id}",
                'question': f"Was ist {defn['term']}?",
                'type': 'single',
                'options': [
                    defn['definition'],
                    "Eine andere Definition",
                    "Keine der Antworten ist korrekt",
                    "Nicht in den Quellen definiert"
                ],
                'correct_answer': 0,
                'explanation': f"{defn['term']}: {defn['definition']}",
                'source_file': source_file,
                'source_page': defn['page'],
                'tags': [defn['term']],
                'difficulty': 2
            }
            questions.append(q)
            self.question_id += 1
            
            # True/False question
            q2 = {
                'id': f"q_{self.question_id}",
                'question': f"Richtig oder Falsch: {defn['term']} {defn['definition']}",
                'type': 'tf',
                'options': ['Richtig', 'Falsch'],
                'correct_answer': 0,
                'explanation': f"Richtig. {defn['term']}: {defn['definition']}",
                'source_file': source_file,
                'source_page': defn['page'],
                'tags': [defn['term']],
                'difficulty': 1
            }
            questions.append(q2)
            self.question_id += 1
        
        return questions
    
    def generate_generic_questions(self, text, page_num, source_file):
        """Generate generic questions from text chunks."""
        questions = []
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
        
        # Generate questions from informative sentences
        for i, sentence in enumerate(sentences[:10]):  # Limit to 10 per page
            if any(keyword in sentence.lower() for keyword in 
                   ['ist', 'sind', 'wird', 'werden', 'bedeutet', 'bezeichnet', 
                    'ermöglicht', 'verwendet', 'besteht', 'umfasst']):
                
                # Extract key terms (capitalized words)
                key_terms = re.findall(r'\b[A-ZÄÖÜ][a-zäöüß]+\b', sentence)
                
                if key_terms:
                    q = {
                        'id': f"q_{self.question_id}",
                        'question': f"Welche Aussage über {key_terms[0]} ist korrekt?",
                        'type': 'single',
                        'options': [
                            sentence,
                            "Diese Information ist nicht in den Quellen enthalten",
                            "Das Gegenteil ist der Fall",
                            "Keine Aussage möglich"
                        ],
                        'correct_answer': 0,
                        'explanation': sentence,
                        'source_file': source_file,
                        'source_page': page_num,
                        'tags': key_terms[:3],
                        'difficulty': 3
                    }
                    questions.append(q)
                    self.question_id += 1
        
        return questions
    
    def process_file(self, pdf_path):
        """Process a single PDF file."""
        print(f"\nProcessing: {pdf_path.name}")
        
        pages_text = self.extract_text_from_pdf(pdf_path)
        if not pages_text:
            return []
        
        all_questions = []
        all_definitions = []
        
        # Extract definitions from each page
        for page_data in pages_text:
            text = self.clean_text(page_data['text'])
            if len(text) < 50:
                continue
                
            definitions = self.find_definitions(text, page_data['page'])
            all_definitions.extend(definitions)
            
            # Generate generic questions
            generic_qs = self.generate_generic_questions(
                text, page_data['page'], pdf_path.name
            )
            all_questions.extend(generic_qs)
        
        # Generate questions from definitions
        def_questions = self.generate_questions_from_definitions(
            all_definitions, pdf_path.name
        )
        all_questions.extend(def_questions)
        
        # Update coverage
        self.coverage[pdf_path.name] = {
            'total_pages': len(pages_text),
            'total_questions': len(all_questions),
            'page_range': f"1-{len(pages_text)}" if pages_text else "unknown",
            'status': 'processed'
        }
        
        print(f"  Generated {len(all_questions)} questions from {len(pages_text)} pages")
        
        return all_questions
    
    def save_questions(self, questions, filename):
        """Save questions to JSON file."""
        output_path = self.output_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"  Saved to {output_path}")
    
    def generate_coverage_report(self):
        """Generate coverage.md report."""
        lines = ["# Question Coverage Report\n"]
        lines.append("| Source File | Questions | Page Range | Status |\n")
        lines.append("|------------|-----------|------------|--------|\n")
        
        total_questions = 0
        for filename, data in sorted(self.coverage.items()):
            total_questions += data['total_questions']
            lines.append(
                f"| {filename} | {data['total_questions']} | "
                f"{data['page_range']} | {data['status']} |\n"
            )
        
        lines.append(f"\n**Total Questions Generated: {total_questions}**\n")
        
        with open('coverage.md', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print(f"\nCoverage report saved to coverage.md")
        print(f"Total questions generated: {total_questions}")
    
    def process_all_files(self):
        """Process all PDF files in sources directory."""
        pdf_files = sorted(self.sources_dir.glob("*.pdf"))
        
        if not pdf_files:
            print("No PDF files found in sources directory!")
            return
        
        print(f"Found {len(pdf_files)} PDF files to process")
        
        for pdf_path in pdf_files:
            questions = self.process_file(pdf_path)
            
            if questions:
                # Save with sanitized filename
                output_name = pdf_path.stem.replace(' ', '_') + '.json'
                self.save_questions(questions, output_name)
        
        self.generate_coverage_report()

if __name__ == "__main__":
    generator = QuestionGenerator()
    generator.process_all_files()
