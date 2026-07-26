"""
AAMU CS Degree Scraper
Extracts CS major data from bulletin PDFs and enriches with the prerequisite
graph and concentration requirements from handwritten notes.
Outputs: scripts/data/cs_knowledge.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber

# ──────────────────────────────────────────────────────────────────────────────
# HARDCODED DATA (verified against handwritten adjacency list & bulletin pages)
# ──────────────────────────────────────────────────────────────────────────────

# Full course catalogue with names and credits
# Source: GCS elective list (p.208), 4-yr plan (p.202), concentration pages (p.206-207)
COURSE_CATALOG: dict[str, dict] = {
    "CS 101": {"name": "Introduction to Computers", "credits": 1, "description": "Introductory overview of computing concepts."},
    "CS 102": {"name": "Intro to Programming I", "credits": 3, "description": "First programming course covering fundamentals using Python or similar language. Min grade C required.", "min_grade": "C"},
    "CS 104": {"name": "Intro to Computers & Ethics", "credits": 3, "description": "Introduction to computer science principles and ethical issues in computing. Min grade C required.", "min_grade": "C"},
    "CS 109": {"name": "Intro to Programming II", "credits": 3, "description": "Continuation of CS 102; covers object-oriented programming concepts. Min grade C required.", "min_grade": "C"},
    "CS 203": {"name": "Discrete Structures", "credits": 3, "description": "Mathematical foundations of computer science: logic, sets, relations, graphs, combinatorics. Min grade C required.", "min_grade": "C"},
    "CS 206": {"name": "Intro Java Programming I", "credits": 3, "description": "Introduction to Java programming language and object-oriented concepts. Min grade C required.", "min_grade": "C"},
    "CS 209": {"name": "Intro to Digital Logic Design", "credits": 3, "description": "Boolean algebra, logic gates, combinational and sequential circuits. Min grade C required.", "min_grade": "C"},
    "CS 215": {"name": "Data Structures", "credits": 3, "description": "Arrays, linked lists, stacks, queues, trees, graphs, sorting and searching algorithms. Min grade C required.", "min_grade": "C"},
    "CS 303": {"name": "Assembly Language", "credits": 3, "description": "Low-level programming using assembly language, memory addressing, and computer architecture basics."},
    "CS 304": {"name": "Intro to Web Programming", "credits": 3, "description": "HTML, CSS, JavaScript and web development fundamentals. Junior Standing required.", "standing": "Junior"},
    "CS 306": {"name": "Java Programming II", "credits": 3, "description": "Advanced Java: data structures, generics, GUI programming, and design patterns."},
    "CS 309": {"name": "Computer Graphics", "credits": 3, "description": "2D and 3D graphics algorithms, transformations, rasterization, and rendering pipelines."},
    "CS 311": {"name": "Intro to Simulation", "credits": 3, "description": "Discrete event simulation, Monte Carlo methods, and modeling techniques."},
    "CS 314": {"name": "Advanced Programming", "credits": 3, "description": "Advanced programming concepts, algorithm design, and software development practices. Min grade C required.", "min_grade": "C"},
    "CS 315": {"name": "Intro to Game Programming", "credits": 3, "description": "Game design principles, game loops, physics engines, and interactive graphics programming."},
    "CS 320": {"name": "Intro to Multimedia Authoring", "credits": 3, "description": "Multimedia content creation, digital media formats, and authoring tools. Junior Standing required.", "standing": "Junior"},
    "CS 321": {"name": "Principles of Information Security", "credits": 3, "description": "Fundamentals of information security: threats, vulnerabilities, policies, access control, and cryptographic basics."},
    "CS 328": {"name": "Object Oriented Design with UML", "credits": 3, "description": "UML modeling, design patterns, and software architecture using object-oriented principles."},
    "CS 330": {"name": "Computers in Society", "credits": 3, "description": "Social, ethical, legal, and professional impact of computing on society."},
    "CS 381": {"name": "Computer Organization", "credits": 3, "description": "CPU architecture, instruction sets, memory hierarchy, I/O systems, and performance analysis. Min grade C required.", "min_grade": "C"},
    "CS 384": {"name": "Operating Systems", "credits": 3, "description": "Process management, memory management, file systems, concurrency, and OS design principles. Min grade C required.", "min_grade": "C"},
    "CS 386": {"name": "Cryptography", "credits": 3, "description": "Symmetric and asymmetric encryption, hash functions, digital signatures, and cryptographic protocols."},
    "CS 389": {"name": "Programming in Robotics Systems", "credits": 3, "description": "Robot programming, sensor integration, control algorithms, and ROS framework."},
    "CS 401": {"name": "Software Engineering", "credits": 3, "description": "Software development lifecycle, requirements engineering, design, testing, and project management. [CS] capstone — cannot be substituted. Min grade C required.", "min_grade": "C", "is_capstone": True},
    "CS 403": {"name": "Senior Problems", "credits": 3, "description": "Individual or group senior project in computer science. [CS] capstone — cannot be substituted. Min grade C required.", "min_grade": "C", "is_capstone": True},
    "CS 405": {"name": "Linux w/ Appl Programming", "credits": 3, "description": "Linux operating system administration, shell scripting, and application programming on Linux. Min grade C required.", "min_grade": "C"},
    "CS 408": {"name": "Wireless Computing", "credits": 3, "description": "Wireless network protocols, mobile computing, IoT, and wireless security."},
    "CS 409": {"name": "Intro to Digital Image Processing", "credits": 3, "description": "Image acquisition, filtering, segmentation, feature extraction, and computer vision fundamentals. Senior Standing typically required.", "standing": "Senior"},
    "CS 410": {"name": "Advanced Topics in Computer Science", "credits": 3, "description": "Advanced topics course; content varies by semester."},
    "CS 412": {"name": "Special Topics in Computer Science", "credits": 3, "description": "Special topics course; content varies by semester."},
    "CS 413": {"name": "Data Science", "credits": 3, "description": "Data collection, cleaning, exploration, visualization, and machine learning for data analysis. Senior Standing typically required.", "standing": "Senior"},
    "CS 414": {"name": "Forensic Computing", "credits": 3, "description": "Digital forensics techniques, evidence collection, analysis tools, and legal considerations. Senior Standing typically required.", "standing": "Senior"},
    "CS 421": {"name": "Computer Security", "credits": 3, "description": "Network security, intrusion detection, vulnerability assessment, penetration testing, and security policy."},
    "CS 425": {"name": "Theory of Algorithms", "credits": 3, "description": "Algorithm analysis, complexity theory, NP-completeness, dynamic programming, and advanced algorithm design. [CS] capstone — cannot be substituted. Min grade C required.", "min_grade": "C", "is_capstone": True},
    "CS 430": {"name": "Machine Learning", "credits": 3, "description": "Supervised and unsupervised learning, neural networks, decision trees, SVM, and model evaluation."},
    "CS 435": {"name": "Intro to Bioinformatics", "credits": 3, "description": "Computational biology, sequence alignment, genomics data analysis, and bioinformatics algorithms. Senior Standing required.", "standing": "Senior"},
    "CS 440": {"name": "Programming Languages", "credits": 3, "description": "Programming language paradigms: functional, logic, object-oriented; syntax, semantics, and language design."},
    "CS 450": {"name": "Artificial Intelligence", "credits": 3, "description": "Search algorithms, knowledge representation, planning, natural language processing, and AI applications."},
    "CS 483": {"name": "Compilers", "credits": 3, "description": "Lexical analysis, parsing, semantic analysis, code generation, and compiler optimization. Senior Standing typically required.", "standing": "Senior"},
    "CS 484": {"name": "Internship", "credits": 3, "description": "Supervised work experience in industry. Junior/Senior level. Max 6 credits combined with co-op education.", "standing": "Junior or Senior"},
    "CS 485": {"name": "Intro to Data Comm. & Networks", "credits": 3, "description": "Network protocols, OSI model, TCP/IP, routing, switching, and network security fundamentals."},
    "CS 486": {"name": "Advanced Data Comm. & Networks", "credits": 3, "description": "Advanced networking topics; builds on CS 485."},
    "CS 488": {"name": "Database Systems", "credits": 3, "description": "Relational model, SQL, normalization, transaction management, indexing, and database design."},
    "CS 490": {"name": "High Performance Computing", "credits": 3, "description": "Parallel programming, MPI, OpenMP, GPU computing, and high-performance computing architectures."},
    # Math prerequisites referenced in CS prereq chains
    "MTH 125": {"name": "Calculus I", "credits": 4, "description": "Limits, derivatives, integrals of single-variable functions.", "department": "MTH"},
    "MTH 126": {"name": "Calculus II", "credits": 4, "description": "Integration techniques, series, polar coordinates.", "department": "MTH"},
    "MTH 237": {"name": "Linear Algebra", "credits": 3, "description": "Vectors, matrices, linear transformations, eigenvalues. Min grade C required.", "department": "MTH", "min_grade": "C"},
    "MTH 453": {"name": "Probability & Statistics", "credits": 3, "description": "Probability theory, distributions, statistical inference. Also listed as ST 453.", "department": "MTH"},
}

# Prerequisite graph from handwritten adjacency list (images)
# Format: { course: [prereqs] }  —  items in a list are AND conditions
# Items in a tuple/list-of-lists are OR conditions → represented as {"or": [...]}
PREREQUISITES: dict[str, list] = {
    "CS 101": [],
    "CS 102": [],
    "CS 104": [],
    "CS 109": ["CS 102"],
    "CS 203": ["CS 102"],
    "CS 206": ["CS 102"],
    "CS 209": ["CS 203"],            # chain: 102→203→209
    "CS 215": ["CS 109"],            # chain: 102→109→215
    "CS 303": ["CS 215"],
    "CS 304": ["Junior Standing"],
    "CS 305": [{"or": ["MTH 126", "MTH 146"]}, "CS 109"],
    "CS 306": ["CS 206"],
    "CS 309": ["CS 215", "MTH 237"],
    "CS 311": ["CS 215"],
    "CS 314": ["CS 109", "CS 206"],  # chain: 102→(109+206)→314
    "CS 315": ["CS 215"],
    "CS 320": ["Junior Standing"],
    "CS 321": ["CS 104"],
    "CS 328": ["CS 109", "CS 206"],  # chain: 102→(109+206)→328
    "CS 330": ["CS 321"],            # chain: 104→321→330
    "CS 381": ["CS 209"],            # chain: 102→203→209→381
    "CS 384": ["CS 215", "CS 209"],  # chain: 102→109→(215+209)→384
    "CS 386": ["CS 215", "CS 203"],  # chain: 102→109→(215+203)→386
    "CS 389": ["CS 109", "CS 206"],  # chain: 102→(109+206)→389
    "CS 401": ["CS 314", "CS 215"],  # chain: 102→(109+206)→(314+215)→401
    "CS 403": ["CS 384", "CS 314"],  # chain: →(384+314)→403
    "CS 405": ["CS 384"],
    "CS 408": ["CS 215"],            # chain: 102→109→215→408
    "CS 409": ["CS 209"],            # chain: 102→203→209→409; senior standing
    "CS 410": ["CS 381", "CS 314"],  # chain: (381+314)→410
    "CS 412": ["CS 215"],
    "CS 413": ["CS 215"],            # senior standing
    "CS 414": ["CS 384"],            # chain: →384→414; senior standing
    "CS 421": ["CS 384"],            # chain: →(215+209)→384→421
    "CS 425": ["CS 215", "MTH 126"], # chain: 102→109→(215+MTH126)→425
    "CS 430": ["CS 215", "MTH 237", "MTH 453"],  # chain: →(215+MTH237+MTH453)→430
    "CS 435": ["Senior Standing"],
    "CS 440": ["CS 314"],            # chain: 102→206→314→440
    "CS 450": ["CS 215"],
    "CS 483": ["CS 215"],            # senior standing
    "CS 484": ["CS 314"],            # chain: 102→206→314→484; junior/senior
    "CS 485": ["CS 381"],            # chain: 102→203→209→381→485
    "CS 486": [{"or": ["CS 381", "CS 485"]}],
    "CS 488": ["CS 215"],            # chain: 102→109→215→488
    "CS 490": ["CS 215", "CS 381"],  # chain: →(215+381)→490
}

# Full prerequisite chain (all ancestors, flattened) — derived from graph above
# Used for RAG "what do I need before I can take X?" queries
FULL_CHAINS: dict[str, str] = {
    "CS 109": "CS 102 → CS 109",
    "CS 203": "CS 102 → CS 203",
    "CS 206": "CS 102 → CS 206",
    "CS 209": "CS 102 → CS 203 → CS 209",
    "CS 215": "CS 102 → CS 109 → CS 215",
    "CS 303": "CS 102 → CS 109 → CS 215 → CS 303",
    "CS 304": "Junior Standing required",
    "CS 305": "CS 102 → CS 109 → (MTH 126 or MTH 146) → CS 305",
    "CS 306": "CS 102 → CS 206 → CS 306",
    "CS 309": "CS 102 → CS 109 → CS 215 and MTH 237 → CS 309",
    "CS 311": "CS 102 → CS 109 → CS 215 → CS 311",
    "CS 314": "CS 102 → (CS 109 and CS 206) → CS 314",
    "CS 315": "CS 102 → CS 109 → CS 215 → CS 315",
    "CS 320": "Junior Standing required",
    "CS 321": "CS 104 → CS 321",
    "CS 328": "CS 102 → (CS 109 and CS 206) → CS 328",
    "CS 330": "CS 104 → CS 321 → CS 330",
    "CS 381": "CS 102 → CS 203 → CS 209 → CS 381",
    "CS 384": "CS 102 → CS 109 → (CS 215 and CS 209) → CS 384",
    "CS 386": "CS 102 → CS 109 → (CS 215 and CS 203) → CS 386",
    "CS 389": "CS 102 → (CS 109 and CS 206) → CS 389",
    "CS 401": "CS 102 → (CS 109 and CS 206) → (CS 314 and CS 215) → CS 401",
    "CS 403": "CS 102 → CS 109 → (CS 215 and CS 209) → CS 384, and CS 314 → CS 403",
    "CS 405": "CS 102 → CS 109 → (CS 215 and CS 209) → CS 384 → CS 405",
    "CS 408": "CS 102 → CS 109 → CS 215 → CS 408",
    "CS 409": "CS 102 → CS 203 → CS 209 → CS 409",
    "CS 410": "CS 102 → (CS 203→CS 209→CS 381) and (CS 109→CS 206→CS 314) → CS 410",
    "CS 412": "CS 102 → CS 109 → CS 215 → CS 412",
    "CS 413": "CS 102 → CS 109 → CS 215 → CS 413",
    "CS 414": "CS 102 → CS 109 → (CS 215 and CS 209) → CS 384 → CS 414",
    "CS 421": "CS 102 → CS 109 → (CS 215 and CS 209) → CS 384 → CS 421",
    "CS 425": "CS 102 → CS 109 → (CS 215 and MTH 126) → CS 425",
    "CS 430": "CS 102 → CS 109 → (CS 215 and MTH 237 and MTH 453) → CS 430",
    "CS 435": "Senior Standing required",
    "CS 440": "CS 102 → CS 206 → CS 314 → CS 440",
    "CS 450": "CS 102 → CS 109 → CS 215 → CS 450",
    "CS 483": "CS 102 → CS 109 → CS 215 → CS 483",
    "CS 484": "CS 102 → CS 206 → CS 314 → CS 484",
    "CS 485": "CS 102 → CS 203 → CS 209 → CS 381 → CS 485",
    "CS 486": "CS 102 → CS 203 → CS 209 → CS 381 (or CS 485) → CS 486",
    "CS 488": "CS 102 → CS 109 → CS 215 → CS 488",
    "CS 490": "CS 102 → CS 109 → (CS 215 and CS 203→CS 209→CS 381) → CS 490",
}

# Concentration requirements — source: bulletin p.206-207 + handwritten notes (cross-verified)
CONCENTRATIONS: dict[str, dict] = {
    "cybersecurity": {
        "name": "Cybersecurity Concentration (CYB)",
        "full_name": "Computer Science — Cybersecurity Concentration",
        "code": "CYB",
        "min_gpa": 2.0,
        "min_grade": "C",
        "total_hours": 21,
        "required_courses": [
            {"code": "CS 381", "name": "Computer Organization", "credits": 3},
            {"code": "CS 384", "name": "Operating Systems", "credits": 3},
            {"code": "CS 488", "name": "Database Systems", "credits": 3},
            {"code": "CS 321", "name": "Principles of Information Security", "credits": 3},
            {"code": "CS 386", "name": "Cryptography", "credits": 3},
            {"code": "CS 414", "name": "Forensic Computing", "credits": 3},
            {"code": "CS 421", "name": "Computer Security", "credits": 3},
        ],
        "notes": "Not open to Liberal Studies majors unless approved by Chair and Dean.",
    },
    "ai": {
        "name": "Artificial Intelligence Concentration (AI)",
        "full_name": "Computer Science — Artificial Intelligence Concentration",
        "code": "AI",
        "min_gpa": 2.0,
        "min_grade": "C",
        "total_hours": 21,
        "required_courses": [
            {"code": "CS 381", "name": "Computer Organization", "credits": 3},
            {"code": "CS 384", "name": "Operating Systems", "credits": 3},
            {"code": "CS 389", "name": "Programming in Robotics Systems", "credits": 3},
            {"code": "CS 409", "name": "Intro to Digital Image Processing", "credits": 3},
            {"code": "CS 430", "name": "Machine Learning", "credits": 3},
            {"code": "CS 450", "name": "Artificial Intelligence", "credits": 3},
            {"code": "CS 488", "name": "Database Systems", "credits": 3},
        ],
        "notes": "Not open to Liberal Studies majors unless approved by Chair and Dean.",
    },
    "general": {
        "name": "General Computer Science Concentration (GCS)",
        "full_name": "Computer Science — General Computer Science Concentration",
        "code": "GCS",
        "min_gpa": 2.0,
        "min_grade": "C",
        "total_hours": 21,  # 18 required + 3 overlap note
        "required_courses": [
            {"code": "CS 381", "name": "Computer Organization", "credits": 3},
            {"code": "CS 384", "name": "Operating Systems", "credits": 3},
            {"code": "CS 488", "name": "Database Systems", "credits": 3},
        ],
        "elective_requirements": {
            "description": "4 elective courses (2 at 300-level, 2 at 400-level) from the GCS Elective list",
            "count_300": 2,
            "count_400": 2,
            "note": "One of the 3xx or 4xx GCS Electives is an overlap. No more than 3 elective courses from any CMP Dept Concentration may be applied.",
        },
        "electives": [
            "CS 303", "CS 304", "CS 306", "CS 309", "CS 311", "CS 315",
            "CS 320", "CS 321", "CS 328", "CS 330", "CS 386", "CS 389",
            "CS 408", "CS 409", "CS 414", "CS 421", "CS 430", "CS 435",
            "CS 440", "CS 450", "CS 483", "CS 484", "CS 485", "CS 490",
        ],
        "notes": "Not open to Liberal Studies majors unless approved by Chair and Dean. One of the 3xx or 4xx GCS Electives is an overlap.",
    },
}

# 4-year degree plan — source: bulletin p.202
# Courses marked with "GenEd" are general education requirements
FOUR_YEAR_PLAN = {
    "program": "Computer Science",
    "total_credits": "125 or 131 (5-year program)",
    "bulletin_year": "2025-2026",
    "notes": [
        "Min grade C required for all CS courses marked with superscript 2.",
        "Min grade B required for courses marked with superscript 3.",
        "Concentrations are minimum 21 hours; some may require additional hours.",
        "[CS] = capstone course and cannot be substituted.",
        "Submit Junior Audit after sophomore year.",
        "Apply for 5-year program at beginning of second semester, junior year.",
        "Submit Senior Record and Application for Graduation in senior year.",
    ],
    "years": {
        "freshman": {
            "semester_1": {
                "label": "Freshman Year — Semester 1",
                "courses": [
                    {"code": "ORI 101", "name": "First Year Experience", "credits": 1},
                    {"code": "ENG 101", "name": "Composition I", "credits": 3, "min_grade": "C"},
                    {"code": "MTH 125", "name": "Calculus I", "credits": 4},
                    {"code": "PED/MSC/HED", "name": "See GenEd Listing", "credits": 2, "type": "GenEd"},
                    {"code": "CS 104", "name": "Intro to Computers & Ethics", "credits": 3},
                ],
                "total_credits": 13,
            },
            "semester_2": {
                "label": "Freshman Year — Semester 2",
                "courses": [
                    {"code": "ORI 102", "name": "First Year Experience", "credits": 1},
                    {"code": "ENG 102", "name": "Composition II", "credits": 3, "min_grade": "C"},
                    {"code": "Fine Arts", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "History", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "MTH 126", "name": "Calculus II", "credits": 4},
                    {"code": "CS 102", "name": "Intro to Programming I", "credits": 3, "min_grade": "C"},
                ],
                "total_credits": 17,
            },
        },
        "sophomore": {
            "semester_1": {
                "label": "Sophomore Year — Semester 1",
                "courses": [
                    {"code": "Lit Sequence", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "PHY 213", "name": "General Physics with Calculus I", "credits": 4},
                    {"code": "History", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "CS 109", "name": "Intro to Programming II", "credits": 3, "min_grade": "C"},
                    {"code": "CS 203", "name": "Discrete Structures", "credits": 3, "min_grade": "C"},
                ],
                "total_credits": 16,
            },
            "semester_2": {
                "label": "Sophomore Year — Semester 2",
                "courses": [
                    {"code": "Lit Sequence", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "PHY 214", "name": "General Physics with Calculus II", "credits": 4},
                    {"code": "Economics", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "CS 206", "name": "Intro Java Programming I", "credits": 3, "min_grade": "C"},
                    {"code": "CS 209", "name": "Intro to Digital Logic Design", "credits": 3, "min_grade": "C"},
                    {"code": "CS 215", "name": "Data Structures", "credits": 3, "min_grade": "C"},
                ],
                "total_credits": 19,
            },
        },
        "junior": {
            "semester_1": {
                "label": "Junior Year — Semester 1",
                "courses": [
                    {"code": "MTH 237", "name": "Linear Algebra", "credits": 3, "min_grade": "C"},
                    {"code": "CS 314", "name": "Advanced Programming", "credits": 3, "min_grade": "C"},
                    {"code": "CS 3xx-4xx", "name": "CS Elective", "credits": 3, "type": "Elective"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                ],
                "total_credits": 15,
            },
            "semester_2": {
                "label": "Junior Year — Semester 2",
                "courses": [
                    {"code": "Hum/Fine Art", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "Soc/Beh Sci", "name": "See GenEd Listing", "credits": 3, "type": "GenEd"},
                    {"code": "Free Elective", "name": "Free Elective", "credits": 3, "type": "Elective"},
                ],
                "total_credits": 15,
            },
        },
        "senior": {
            "semester_1": {
                "label": "Senior Year — Semester 1",
                "courses": [
                    {"code": "MTH 453", "name": "Probability & Statistics", "credits": 3},
                    {"code": "CS 401", "name": "Software Engineering", "credits": 3, "min_grade": "C", "is_capstone": True},
                    {"code": "CS 425", "name": "Theory of Algorithms", "credits": 3, "min_grade": "C", "is_capstone": True},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "5xx CMP Core", "name": "CMP Core course (if in 5-yr program)", "credits": "0-3", "type": "Optional"},
                ],
                "total_credits": "15-18",
            },
            "semester_2": {
                "label": "Senior Year — Semester 2",
                "courses": [
                    {"code": "CS 403", "name": "Senior Problems", "credits": 3, "min_grade": "C", "is_capstone": True},
                    {"code": "CS 405", "name": "Linux w/ Appl Programming", "credits": 3, "min_grade": "C"},
                    {"code": "Concentration", "name": "Concentration Course", "credits": 3, "type": "Concentration"},
                    {"code": "Free Elective", "name": "Free Elective", "credits": 3, "type": "Elective"},
                    {"code": "CS 410 or Seminar", "name": "CS 410 OR Seminar OR 5xx CMP Core course (if in 5-yr program)", "credits": 3, "type": "Elective/Option"},
                    {"code": "5xx CMP Core", "name": "CMP Core course (if in 5-yr program)", "credits": "0-3", "type": "Optional"},
                ],
                "total_credits": "15-18",
            },
        },
    },
}

# Courses that appear in each concentration (for fast lookup)
CONCENTRATION_MEMBERSHIP: dict[str, list[str]] = {
    "CS 381": ["cybersecurity", "ai", "general"],
    "CS 384": ["cybersecurity", "ai", "general"],
    "CS 488": ["cybersecurity", "ai", "general"],
    "CS 321": ["cybersecurity"],
    "CS 386": ["cybersecurity"],
    "CS 414": ["cybersecurity"],
    "CS 421": ["cybersecurity"],
    "CS 389": ["ai"],
    "CS 409": ["ai"],
    "CS 430": ["ai"],
    "CS 450": ["ai"],
}

# Which year/semester a course appears in the 4-year plan
PLAN_PLACEMENT: dict[str, dict] = {
    "CS 104": {"year": "Freshman", "semester": 1},
    "CS 102": {"year": "Freshman", "semester": 2},
    "CS 109": {"year": "Sophomore", "semester": 1},
    "CS 203": {"year": "Sophomore", "semester": 1},
    "CS 206": {"year": "Sophomore", "semester": 2},
    "CS 209": {"year": "Sophomore", "semester": 2},
    "CS 215": {"year": "Sophomore", "semester": 2},
    "CS 314": {"year": "Junior", "semester": 1},
    "MTH 237": {"year": "Junior", "semester": 1},
    "CS 401": {"year": "Senior", "semester": 1},
    "CS 425": {"year": "Senior", "semester": 1},
    "MTH 453": {"year": "Senior", "semester": 1},
    "CS 403": {"year": "Senior", "semester": 2},
    "CS 405": {"year": "Senior", "semester": 2},
}

# Courses that require senior standing (s.s.) per handwritten notes
SENIOR_STANDING_COURSES = {"CS 409", "CS 413", "CS 414", "CS 435", "CS 483"}


# ──────────────────────────────────────────────────────────────────────────────
# PDF EXTRACTION
# ──────────────────────────────────────────────────────────────────────────────

def extract_pdf_text(pdf_path: str) -> list[dict]:
    """Extract text and tables from a PDF, page by page."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=2, y_tolerance=2) or ""
            tables = page.extract_tables() or []
            pages.append({
                "page_number": i + 1,
                "text": text.strip(),
                "tables": tables,
            })
    return pages


def parse_course_from_table_row(row: list) -> dict | None:
    """Try to extract a course entry from a table row like [CS 102, Title, 3]."""
    if not row or len(row) < 2:
        return None
    row = [str(c).strip() if c else "" for c in row]
    # Match patterns like "CS 102", "MTH 237", "PHY 213"
    code_match = re.match(r"^([A-Z]{2,4})\s+(\d{3}[A-Z]?)$", row[0])
    if not code_match:
        return None
    dept, num = code_match.groups()
    code = f"{dept} {num}"
    title = row[1] if len(row) > 1 else ""
    credits_raw = row[2] if len(row) > 2 else ""
    try:
        credits = int(re.search(r"\d+", credits_raw).group()) if re.search(r"\d+", credits_raw) else None
    except Exception:
        credits = None
    return {"code": code, "name": title, "credits": credits}


def extract_courses_from_pages(pages: list[dict]) -> list[dict]:
    """Parse course codes and names from all extracted tables."""
    found = []
    seen = set()
    for page in pages:
        for table in page["tables"]:
            for row in table:
                course = parse_course_from_table_row(row)
                if course and course["code"] not in seen:
                    seen.add(course["code"])
                    course["source_page"] = page["page_number"]
                    found.append(course)
    return found


def extract_concentration_blocks(pages: list[dict]) -> list[str]:
    """Extract raw text blocks that look like concentration requirements."""
    blocks = []
    full_text = "\n".join(p["text"] for p in pages)
    # Split on known concentration headers
    pattern = r"(CMP\).+?CONCENTRATION.+?)(?=(?:CMP\)|EE\)|\Z))"
    matches = re.findall(pattern, full_text, re.DOTALL | re.IGNORECASE)
    return matches


# ──────────────────────────────────────────────────────────────────────────────
# BUILD KNOWLEDGE BASE
# ──────────────────────────────────────────────────────────────────────────────

def resolve_prereq_label(prereq) -> str:
    """Turn a prereq entry (string or OR-dict) into a human-readable string."""
    if isinstance(prereq, dict) and "or" in prereq:
        return " or ".join(prereq["or"])
    return str(prereq)


def build_course_records(pdf_courses: list[dict]) -> list[dict]:
    """Merge hardcoded catalog with PDF-extracted data and prereq graph."""
    records = []

    # Start from our hardcoded catalog (ground truth)
    for code, info in COURSE_CATALOG.items():
        prereqs = PREREQUISITES.get(code, [])
        prereq_strings = [resolve_prereq_label(p) for p in prereqs]
        full_chain = FULL_CHAINS.get(code, "No prerequisites" if not prereqs else "See prerequisites")
        concentrations = CONCENTRATION_MEMBERSHIP.get(code, [])
        placement = PLAN_PLACEMENT.get(code, {})
        is_senior_standing = code in SENIOR_STANDING_COURSES

        records.append({
            "id": f"course_{code.replace(' ', '_')}",
            "type": "course",
            "code": code,
            "name": info["name"],
            "credits": info["credits"],
            "description": info.get("description", ""),
            "department": info.get("department", "CS"),
            "level": int(re.search(r"\d{3}", code).group()[0]) * 100 if re.search(r"\d{3}", code) else None,
            "prerequisites_immediate": prereq_strings,
            "prerequisites_full_chain": full_chain,
            "min_grade": info.get("min_grade"),
            "is_capstone": info.get("is_capstone", False),
            "senior_standing_required": is_senior_standing,
            "standing_required": info.get("standing"),
            "concentrations": concentrations,
            "plan_year": placement.get("year"),
            "plan_semester": placement.get("semester"),
            "bulletin_year": "2025-2026",
        })

    # Supplement with any courses found only in PDF (not in our catalog)
    known = {r["code"] for r in records}
    for pc in pdf_courses:
        if pc["code"] not in known and pc["code"].startswith("CS"):
            records.append({
                "id": f"course_{pc['code'].replace(' ', '_')}",
                "type": "course",
                "code": pc["code"],
                "name": pc.get("name", ""),
                "credits": pc.get("credits"),
                "description": "Extracted from bulletin PDF.",
                "department": "CS",
                "prerequisites_immediate": [],
                "prerequisites_full_chain": "",
                "concentrations": [],
                "bulletin_year": "2025-2026",
                "source": "pdf_only",
            })

    return records


def build_concentration_records() -> list[dict]:
    records = []
    for key, conc in CONCENTRATIONS.items():
        course_list = "\n".join(
            f"  - {c['code']} {c['name']} ({c['credits']} credits)"
            for c in conc["required_courses"]
        )
        if key == "general":
            elective_text = (
                f"\n  Elective Requirements: {conc['elective_requirements']['description']}\n"
                f"  Eligible electives: {', '.join(conc['electives'])}"
            )
        else:
            elective_text = ""

        records.append({
            "id": f"concentration_{key}",
            "type": "concentration",
            "key": key,
            "code": conc["code"],
            "name": conc["name"],
            "full_name": conc["full_name"],
            "min_gpa": conc["min_gpa"],
            "min_grade": conc["min_grade"],
            "total_hours": conc["total_hours"],
            "required_courses": conc["required_courses"],
            "electives": conc.get("electives", []),
            "elective_requirements": conc.get("elective_requirements"),
            "notes": conc.get("notes", ""),
            "bulletin_year": "2025-2026",
            "text_summary": (
                f"{conc['full_name']}\n"
                f"Minimum GPA: {conc['min_gpa']} | Minimum Grade: {conc['min_grade']}\n"
                f"Total hours: {conc['total_hours']} credit hours\n\n"
                f"Required Courses:\n{course_list}"
                f"{elective_text}\n\n"
                f"Note: {conc.get('notes', '')}"
            ),
        })
    return records


def build_prereq_chain_records() -> list[dict]:
    """One record per course that documents its full prerequisite ancestry."""
    records = []
    for code, chain in FULL_CHAINS.items():
        info = COURSE_CATALOG.get(code, {})
        records.append({
            "id": f"prereq_{code.replace(' ', '_')}",
            "type": "prerequisite_chain",
            "course_code": code,
            "course_name": info.get("name", ""),
            "full_chain": chain,
            "immediate_prereqs": [resolve_prereq_label(p) for p in PREREQUISITES.get(code, [])],
            "text_summary": (
                f"To take {code} ({info.get('name', '')}), you need:\n"
                f"Full prerequisite chain: {chain}\n"
                f"Immediate prerequisites: {', '.join([resolve_prereq_label(p) for p in PREREQUISITES.get(code, [])]) or 'None'}"
            ),
            "bulletin_year": "2025-2026",
        })
    return records


def build_plan_records() -> list[dict]:
    """One record per semester of the 4-year degree plan."""
    records = []
    for year_key, year_data in FOUR_YEAR_PLAN["years"].items():
        for sem_key, sem_data in year_data.items():
            courses_text = "\n".join(
                f"  - {c['code']}: {c['name']} ({c['credits']} credits)"
                + (" [CAPSTONE]" if c.get("is_capstone") else "")
                + (f" [min grade {c['min_grade']}]" if c.get("min_grade") else "")
                for c in sem_data["courses"]
            )
            records.append({
                "id": f"plan_{year_key}_{sem_key}",
                "type": "four_year_plan",
                "year": year_key,
                "semester": sem_key,
                "label": sem_data["label"],
                "courses": sem_data["courses"],
                "total_credits": sem_data["total_credits"],
                "bulletin_year": "2025-2026",
                "text_summary": (
                    f"{sem_data['label']} — Total credits: {sem_data['total_credits']}\n\n"
                    f"Courses:\n{courses_text}"
                ),
            })
    return records


def build_overview_record(pdf_pages: list[dict]) -> dict:
    raw_text = "\n\n".join(p["text"] for p in pdf_pages if p["text"])
    return {
        "id": "overview_cs_major",
        "type": "degree_overview",
        "text_summary": (
            "Computer Science Major — Alabama A&M University (AAMU)\n"
            "Department of Electrical Engineering & Computer Science, CETPS\n\n"
            "Total credit hours: 125 (or 131 for 5-year program)\n"
            "Available concentrations: Cybersecurity (CYB), Artificial Intelligence (AI), "
            "General Computer Science (GCS)\n\n"
            "Core CS courses required of all students:\n"
            "CS 102 (Intro to Programming I), CS 104 (Intro to Computers & Ethics), "
            "CS 109 (Intro to Programming II), CS 203 (Discrete Structures), "
            "CS 206 (Intro Java Programming I), CS 209 (Digital Logic Design), "
            "CS 215 (Data Structures), CS 314 (Advanced Programming), "
            "CS 401 (Software Engineering) [capstone], CS 403 (Senior Problems) [capstone], "
            "CS 405 (Linux w/ Appl Programming), CS 425 (Theory of Algorithms) [capstone]\n\n"
            "Required Math: MTH 125 (Calculus I), MTH 126 (Calculus II), "
            "MTH 237 (Linear Algebra), MTH 453 (Probability & Statistics)\n\n"
            "Milestones: Submit Junior Audit after sophomore year. "
            "Apply for 5-year program at start of junior year, second semester. "
            "Submit Senior Record and Application for Graduation in senior year.\n\n"
            "Minimum grade C required in all CS major courses. "
            "Concentration minimum GPA: 2.0.\n\n"
            "Bulletin year: 2025-2026"
        ),
        "bulletin_year": "2025-2026",
        "raw_pdf_text": raw_text[:4000],  # first 4000 chars as supplemental context
    }


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────

def main():
    pdf_dir = Path("/Users/jeebanbashyal/Desktop/AAMU Advising")
    pdf_files = {
        "2025-2026": pdf_dir / "undergraduate-bulletin-2025-2026.pdf",
        "2026-2027": pdf_dir / "undergraduate-bulletin-2026-2027.pdf",
    }

    all_pdf_pages: list[dict] = []
    for year_label, pdf_path in pdf_files.items():
        if not pdf_path.exists():
            print(f"[WARN] PDF not found: {pdf_path}", file=sys.stderr)
            continue
        print(f"[INFO] Extracting: {pdf_path.name}")
        pages = extract_pdf_text(str(pdf_path))
        for p in pages:
            p["bulletin_year"] = year_label
        all_pdf_pages.extend(pages)
        print(f"       {len(pages)} pages extracted")

    # Parse PDF tables for any extra course entries
    pdf_courses = extract_courses_from_pages(all_pdf_pages)
    print(f"[INFO] {len(pdf_courses)} course entries found in PDF tables")

    # Build structured records
    course_records = build_course_records(pdf_courses)
    concentration_records = build_concentration_records()
    prereq_records = build_prereq_chain_records()
    plan_records = build_plan_records()
    overview = build_overview_record(all_pdf_pages)

    knowledge_base = {
        "metadata": {
            "source": "AAMU Undergraduate Bulletin 2025-2026 and 2026-2027",
            "department": "Electrical Engineering & Computer Science, CETPS",
            "major": "Computer Science",
            "concentrations": ["Cybersecurity (CYB)", "Artificial Intelligence (AI)", "General CS (GCS)"],
            "total_records": (
                1 + len(course_records) + len(concentration_records)
                + len(prereq_records) + len(plan_records)
            ),
        },
        "overview": overview,
        "courses": course_records,
        "concentrations": concentration_records,
        "prerequisite_chains": prereq_records,
        "four_year_plan": plan_records,
        "raw_pdf_pages": all_pdf_pages,
    }

    out_path = Path(__file__).parent / "data" / "cs_knowledge.json"
    out_path.parent.mkdir(exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(knowledge_base, f, indent=2)

    print(f"\n[DONE] Knowledge base written to: {out_path}")
    print(f"       Courses: {len(course_records)}")
    print(f"       Concentrations: {len(concentration_records)}")
    print(f"       Prereq chain records: {len(prereq_records)}")
    print(f"       Semester plan records: {len(plan_records)}")
    print(f"       Total records: {knowledge_base['metadata']['total_records']}")


if __name__ == "__main__":
    main()
