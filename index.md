---
layout: default
title: Drupal Cheatsheets
---

<ul>
  {% for page in site.pages %}
    {% unless page.name == 'index.md' or page.name == 'index.html' or page.name endswith '.css' %}
        <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
        {% endunless %}
  {% endfor %}
</ul>
