import os
from django.conf import settings
from django.template.loader import render_to_string

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    WEASYPRINT_AVAILABLE = False

def generer_bulletin_pdf(bulletin):
    """
    Génère un bulletin de paie au format PDF.
    En cas d'absence de WeasyPrint (sur Windows sans GTK+), retourne un fichier HTML.
    """
    employe = bulletin.employe
    anciennete = max(0, bulletin.annee - employe.date_embauche.year)
    
    mois_list = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]
    mois_nom = mois_list[bulletin.mois - 1] if 1 <= bulletin.mois <= 12 else str(bulletin.mois)

    context = {
        'bulletin': bulletin,
        'employe': employe,
        'anciennete': anciennete,
        'mois_nom': mois_nom
    }
    
    html_content = render_to_string('bulletin_template.html', context)
    
    if WEASYPRINT_AVAILABLE:
        pdf_bytes = HTML(string=html_content).write_pdf()
        filename = f"bulletin_{employe.matricule}_{bulletin.annee}_{bulletin.mois}.pdf"
        return filename, pdf_bytes
    else:
        filename = f"bulletin_{employe.matricule}_{bulletin.annee}_{bulletin.mois}.html"
        return filename, html_content.encode('utf-8')
