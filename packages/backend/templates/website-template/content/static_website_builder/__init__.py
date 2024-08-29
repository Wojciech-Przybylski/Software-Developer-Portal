from flask import Flask, render_template

app = Flask(__name__)

# With both trim_blocks and lstrip_blocks enabled, you can put block tags
# on their own lines,and the entire block line will be removed when rendered,
# preserving the whitespace of
app.jinja_env.trim_blocks = True
app.jinja_env.lstrip_blocks = True

# The MIME type that is assumed when it can not be determined from the filename extension.
app.config["FREEZER_DEFAULT_MIMETYPE"] = "text/html"
# Path to the directory where to put the generated static site.
app.config["FREEZER_DESTINATION"] = "../build"

import static_website_builder.page  # noqa: F401
import static_website_builder.utils  # noqa: F401


@app.route("/")
def index():
    return render_template("index.html")


@app.errorhandler(404)
@app.route("/page-not-found")
def page_not_found(e=None):
    return render_template("404.html"), 404 if e else 200
