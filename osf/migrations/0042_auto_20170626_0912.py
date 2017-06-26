# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-26 14:12
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('osf', '0041_preprintprovider_preprint_word'),
    ]

    operations = [
        migrations.AlterField(
            model_name='preprintprovider',
            name='preprint_word',
            field=models.CharField(choices=[(b'preprint', b'Preprint'), (b'paper', b'Paper'), (b'thesis', b'Thesis'), (b'none', b'None')], default=b'preprint', max_length=10),
        ),
    ]
