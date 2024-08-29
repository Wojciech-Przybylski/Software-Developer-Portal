from flask import render_template
from static_website_builder import app
from .utils import _page_not_found, read_markdown


@app.route("/page-1")
def page_1():
    body = read_markdown("./content/page_1.md")

    return render_template("page_1.html", page_body=body)


@app.route("/page-2")
def page_2():
    body = read_markdown("./content/page_2.md")

    return render_template("page_2.html", page_body=body)


@app.route("/page-3")
def page_3():
    body = read_markdown("./content/page_3.md")

    return render_template("page_3.html", page_body=body)


@app.route("/about")
def about_page():
    body = read_markdown("./content/about.md")

    return render_template("about.html", page_body=body)


@app.route("/accessibility-statement")
def accessibility_page():
    body = read_markdown("./content/accessibility.md")

    return render_template("accessibility_statement.html", page_body=body)


@app.route("/cookies")
def cookies_page():
    return render_template("cookies.html")


@app.route("/privacy-and-data-protection")
def privacy_data_page():
    body = read_markdown("./content/privacy_data.md")

    return render_template("privacy_data.html", page_body=body)


@app.route("/.well-known/security.txt")
def security_text_page():
    try:
        with open(".well-known/security.txt", "r", encoding="utf-8") as input_text:
            content = input_text.read()
    except OSError as e:
        _page_not_found(e)
    return render_template("security.html", content=content)
