# Generated migration to add justifie field to Pointage model
from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('pointage', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='pointage',
            name='justifie',
            field=models.BooleanField(default=False),
        ),
    ]
