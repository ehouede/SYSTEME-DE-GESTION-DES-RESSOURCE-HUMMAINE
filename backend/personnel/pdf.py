import os
from django.conf import settings
from django.template.loader import render_to_string
from django.core.files.base import ContentFile

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    WEASYPRINT_AVAILABLE = False
    import warnings
    warnings.warn(f"WeasyPrint n'est pas disponible ou GTK+ est manquant. Un fallback HTML sera utilisé. Détail : {e}")

def generer_contrat_pdf(employe, contrat):
    """
    Génère un contrat au format PDF à partir d'un template HTML.
    Si WeasyPrint n'est pas disponible, génère un fichier HTML.
    """
    context = {
        'employe': employe,
        'contrat': contrat,
    }
    html_content = render_to_string('contrat_template.html', context)
    
    if WEASYPRINT_AVAILABLE:
        pdf_bytes = HTML(string=html_content).write_pdf()
        filename = f"contrat_{employe.matricule}.pdf"
        return filename, pdf_bytes
    else:
        # Fallback si WeasyPrint/GTK n'est pas disponible sous Windows
        filename = f"contrat_{employe.matricule}.html"
        return filename, html_content.encode('utf-8')
