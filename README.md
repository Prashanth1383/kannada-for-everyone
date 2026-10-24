# Kannada for Everyone (Python / Flask)

A website that helps non-Kannada speakers learn practical Kannada through everyday
conversations, situations, vocabulary and guided practice, plus Karnataka's places,
a district map and an AI conversation partner.

## Run in VS Code
1. Open this folder in VS Code.
2. Terminal > New Terminal:
   python -m venv venv
   venv\Scripts\activate          (Mac/Linux: source venv/bin/activate)
   pip install -r requirements.txt
3. Optional AI answers: copy .env.example to .env and paste your Anthropic API key.
4. python app.py   (or press F5)
5. Open http://127.0.0.1:5000 in Chrome.

Run the tests: python -m unittest discover tests

## Structure
app.py              Flask server and AI route
data/*.json         All content: lessons, scenes, places, districts, tips
data/ai_prompt.txt  Instructions for the AI partner
templates/          Page template
static/             CSS, JavaScript, favicon
tests/              Automated tests
