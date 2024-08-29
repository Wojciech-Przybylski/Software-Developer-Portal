from flask_frozen import Freezer
from static_website_builder import app

freezer = Freezer(app)

if __name__ == "__main__":
    freezer.freeze()
