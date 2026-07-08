from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
PDF_DIR = ROOT / "assets" / "pdfs"

BLUE = colors.HexColor("#b5d1d0")
ORANGE = colors.HexColor("#d66128")
CREAM = colors.HexColor("#f5f4eb")
INK = colors.HexColor("#17130f")
MUTED = colors.HexColor("#8d6f5d")


TITLE_STYLE = ParagraphStyle(
    "Title",
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=27,
    textColor=ORANGE,
    spaceAfter=12,
)

SECTION_STYLE = ParagraphStyle(
    "Section",
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    textColor=ORANGE,
    spaceBefore=10,
    spaceAfter=5,
)

BODY_STYLE = ParagraphStyle(
    "Body",
    fontName="Helvetica",
    fontSize=10.5,
    leading=14,
    textColor=INK,
    spaceAfter=4,
)

BOLD_STYLE = ParagraphStyle(
    "Bold",
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=14,
    textColor=INK,
    spaceAfter=4,
)

SMALL_STYLE = ParagraphStyle(
    "Small",
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=MUTED,
)

CONTACT_LABEL_STYLE = ParagraphStyle(
    "ContactLabel",
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=13,
    textColor=ORANGE,
)

CONTACT_STYLE = ParagraphStyle(
    "Contact",
    fontName="Helvetica",
    fontSize=10,
    leading=13,
    textColor=INK,
)

TIME_STYLE = ParagraphStyle(
    "Time",
    fontName="Helvetica-Bold",
    fontSize=10.2,
    leading=12,
    textColor=CREAM,
)

TASK_STYLE = ParagraphStyle(
    "Task",
    fontName="Helvetica",
    fontSize=9.5,
    leading=12.5,
    textColor=INK,
)


def draw_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], stroke=0, fill=1)
    canvas.setFillColor(CREAM)
    canvas.roundRect(0.45 * inch, 0.45 * inch, doc.pagesize[0] - 0.9 * inch, doc.pagesize[1] - 0.9 * inch, 22, stroke=0, fill=1)
    canvas.setStrokeColor(ORANGE)
    canvas.setLineWidth(2)
    canvas.roundRect(0.45 * inch, 0.45 * inch, doc.pagesize[0] - 0.9 * inch, doc.pagesize[1] - 0.9 * inch, 22, stroke=1, fill=0)
    canvas.restoreState()


def bullet(text):
    return Paragraph("- " + text, BODY_STYLE)


def build_contact_box(rows):
    table_data = [[Paragraph(label, CONTACT_LABEL_STYLE), Paragraph(value, CONTACT_STYLE)] for label, value in rows]
    table = Table(table_data, colWidths=[1.28 * inch, 4.72 * inch], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffaf1")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#e8c9b4")),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#ead8ca")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def build_checklist(rows):
    table_data = []
    for time, items in rows:
        item_flow = [Paragraph("- " + item, TASK_STYLE) for item in items]
        table_data.append([Paragraph(time, TIME_STYLE)])
        table_data.append([item_flow])

    table = Table(table_data, colWidths=[6 * inch], hAlign="LEFT")
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#e8c9b4")),
    ]

    for row_index in range(len(table_data)):
        if row_index % 2 == 0:
            style.extend(
                [
                    ("BACKGROUND", (0, row_index), (-1, row_index), ORANGE),
                    ("BOTTOMPADDING", (0, row_index), (-1, row_index), 5),
                ]
            )
        else:
            style.extend(
                [
                    ("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#fffaf1")),
                    ("LINEBELOW", (0, row_index), (-1, row_index), 0.5, colors.HexColor("#ead8ca")),
                    ("TOPPADDING", (0, row_index), (-1, row_index), 8),
                    ("BOTTOMPADDING", (0, row_index), (-1, row_index), 9),
                ]
            )

    table.setStyle(
        TableStyle(style)
    )
    return table


def build_pdf(filename, title, description, checklist=None, sections=None, point_person=None, contacts=None):
    path = PDF_DIR / filename
    doc = BaseDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="role", frames=[frame], onPage=draw_background)])

    story = [Paragraph(title, TITLE_STYLE)]
    if point_person:
        story.append(Paragraph("<b>Point Person:</b> " + point_person, BODY_STYLE))
        story.append(Spacer(1, 6))
    if contacts:
        story.append(build_contact_box(contacts))
        story.append(Spacer(1, 7))
    story.append(Paragraph("DESCRIPTION", SECTION_STYLE))
    story.append(Paragraph(description, BODY_STYLE))

    if checklist:
        story.append(Paragraph("ROLE CHECKLIST (TUESDAY-THURSDAY)", SECTION_STYLE))
        story.append(build_checklist(checklist))

    if sections:
        for heading, items in sections:
            story.append(Paragraph(heading, SECTION_STYLE))
            for item in items:
                if isinstance(item, tuple):
                    story.append(Paragraph("<b>" + item[0] + "</b> " + item[1], BODY_STYLE))
                else:
                    story.append(bullet(item))

    doc.build(story)


build_pdf(
    "CC GAMES ROLES GAMES CORDINATOR.pdf",
    "GAMES COORDINATOR",
    "The Games Coordinator will provide leadership within their designated area of team competitions, ensuring referees are equipped and supported to lead their games effectively and overseeing the scoring for each of their designated games.",
    checklist=[
        ("11:30 AM", [
            "Lead Games Crew Rally with the Referees in your designated area of CC Games, ensuring everyone is on the same page for the day.",
            "Set up team flags in the order of team numbers for each age group.",
            "Help Referees set up within your designated area of CC Games.",
        ]),
        ("12:00 PM", ["Ensure each game in your area has been properly set up."]),
        ("12:50 PM", ["Be present at the BLUE Game Field."]),
        ("1:00 PM", ["Help facilitate attendance."]),
        ("1:10 PM", ["On the call of the Games Lead, initiate CC Games on your field for the day.", "Check in with your Referees throughout the time of CC Games."]),
        ("3:00 PM", ["Gather with your Referees at the end of Games to finalize scoring in the app and to give/receive feedback.", "Connect with the Games Lead to confirm scores and to give/receive feedback."]),
    ],
)

build_pdf(
    "CC GAMES ROLES TEAM LEADER.pdf",
    "TEAM LEADER",
    "Team Leaders will lead and care for a team of students throughout Community Camp Games.",
    checklist=[
        ("General", [
            "Foster a relationship with the students on your team, establishing yourself as someone they can go to throughout their week of camp and beyond.",
            "Connect with the students on your team throughout the week.",
        ]),
        ("11:30-11:45 AM", [
            "Lead Team Gathering.",
            "Help students build relationships with one another.",
            "Ensure students are prepared for each day of team competitions: game rules and proper attire.",
        ]),
        ("12:50 PM", ["Be present at your CC Games field."]),
        ("1:00 PM", ["Record attendance for your team on the COF app."]),
        ("1:10 PM", ["Following your team's schedule, lead your students through each game."]),
        ("3:00 PM", ["Communicate any helpful feedback to the Games Lead following each day of CC Games."]),
    ],
)

build_pdf(
    "CC GAMES ROLES REFEREE.pdf",
    "REFEREE",
    "Referees will lead their respective CC Game according to the rules given, ensuring the environment is kept safe physically and relationally.",
    checklist=[
        ("11:30 AM", ["Attend Games Crew Rally, led by your Games Coordinator.", "Set up the game you will be leading. Assist others as needed."]),
        ("12:50 PM", ["Be present at the BLUE Game Field."]),
        ("1:00 PM", ["Help Games Coordinator ensure all students are present."]),
        ("1:05 PM", ["Be in your designated area, ready to lead your game."]),
        ("1:10-3:00 PM", [
            "Clearly explain the rules of the game at the beginning of each round.",
            "Ensure the environment is kept safe physically and relationally for both students and Team Leaders.",
            "Track the score for each team throughout the afternoon on the COF app.",
        ]),
        ("3:00 PM", ["Gather with Games Coordinator and Referees to report your scores and to give/receive helpful feedback."]),
    ],
)

build_pdf(
    "Role Descriptions FREE TIME.pdf",
    "FREE TIME RESPONSIBILITIES",
    "Free Time leaders help create a relationally warm, physically safe, and easy-to-enter environment for students during afternoon and night Free Time.",
    contacts=[
        ("Afternoon", "Annalise Brubaker (937) 901-6779"),
        ("Night", "Jake Loranzan (937) 336-4909"),
    ],
    sections=[
        ("AFTERNOON & NIGHT", [
            "Connect relationally with the students and leaders you get to interact with.",
            "Arrive for your Free Time assignment at least 5 minutes prior to your scheduled time to serve.",
            "Foster a physically and relationally safe environment for students.",
            "Connect students with other students.",
        ]),
        ("CONVERSATION STARTERS", [
            "How is your day going?",
            "What stuck out to you in this morning's/last night's message?",
            "What's been your favorite part of camp so far?",
            "What other Free Time activities are you going to get into?",
            "What are you looking forward to?",
        ]),
        ("ADDITIONAL NOTES", [
            ("Free Time Lead:", "Afternoon: Annalise Brubaker. Night: Jake Loranzan."),
            "Ensure leaders are present in their assigned areas. See PCO Services for serving assignments.",
            "Throughout Free Time, check in with the leaders to see how they are doing, supporting them in any way they may need.",
            "Answer any questions leaders have regarding Free Time.",
        ]),
    ],
)

build_pdf(
    "Role Descriptions DORMS.pdf",
    "DORM RESPONSIBILITIES",
    "Community Camp Leaders are responsible for ensuring a safe space is created in the dorms for students to grow in their relationship with Jesus and to experience connection with other students and leaders.",
    contacts=[
        ("Guys", "Matt Hounshell (937) 423-8560"),
        ("Girls", "Bri Baker (937) 733-2505"),
    ],
    sections=[
        ("COMMUNICATION", [
            "Follow Tiers of Communication as needs arise with students.",
        ]),
        ("ALL DORM LEADERS", [
            "Keep the dorm space relatively clean and tidy throughout the week.",
            "Students are responsible for tidying their own space, but they may need guidance.",
            "Be intentional with morning and evening clean-up times.",
        ]),
        ("IF ASSIGNED AS DORM LEADER", [
            ("Daily Rhythm:", "Lights on at 7:00 AM each morning. Lights out at 11:30 PM each night."),
            ("Exceptions:", "Friday morning wake-up is 7:30 AM. Follow anything communicated by the Next Gen Director."),
            ("Clean-Up:", "Facilitate morning and evening clean-up."),
            ("Meals:", "Ensure dorms are clear for each meal. All students MUST attend Breakfast, Lunch, and Dinner. This does not have to be you specifically, but ensure at least one leader checks the dorm during each meal. Example: assign each leader in your dorm to a meal for the week."),
            ("Attendance:", "Take attendance in your dorm each night. Submit attendance through the COF app."),
        ]),
    ],
)
