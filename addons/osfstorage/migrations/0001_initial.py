# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-10-14 16:40
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import osf.models.base


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('osf', '0006_merge'),
    ]

    operations = [
        migrations.CreateModel(
            name='NodeSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('_id', models.CharField(db_index=True, default=osf.models.base.generate_object_id, max_length=24, unique=True)),
                ('deleted', models.BooleanField(default=False)),
                ('owner', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='addons_osfstorage_node_settings', to='osf.AbstractNode')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]