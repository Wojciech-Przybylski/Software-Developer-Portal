from flask import abort
from markupsafe import escape, Markup
import markdown


def _page_not_found(error):
    print(error)
    abort(404)


def read_markdown(markdown_file):
    try:
        with open(markdown_file, "r", encoding="utf-8") as input_file:
            text = input_file.read()
            escaped_text = escape(text)
            body = Markup(markdown.markdown(escaped_text))
    except OSError as e:
        _page_not_found(e)

    return body
